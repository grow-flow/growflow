import { Router, Request, Response } from "express";
import { prisma } from "../database";
import { getCurrentPhase } from "../utils/phaseUtils";

const router = Router();

const areaIncludes = {
  plants: {
    where: { isActive: true },
    include: {
      strain: true,
      phases: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  events: {
    orderBy: { timestamp: 'desc' as const },
    take: 50,
  },
};

const serializeEvent = (e: any) => ({
  ...e,
  data: e.data ? (typeof e.data === 'string' ? JSON.parse(e.data) : e.data) : null,
});

const serializeArea = (area: any) => {
  if (!area) return area;
  return {
    ...area,
    events: area.events?.map(serializeEvent),
  };
};

// List all areas with plant counts and latest environment reading
router.get("/", async (_req: Request, res: Response) => {
  try {
    const areas = await prisma.growArea.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        plants: {
          where: { isActive: true },
          select: { id: true },
        },
        events: {
          where: { type: 'environment' },
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
    res.json(areas.map((a) => ({
      ...a,
      plantCount: a.plants.length,
      plants: undefined,
      events: a.events.map(serializeEvent),
    })));
  } catch (error) {
    console.error("🔴 [Areas] Error fetching areas:", error);
    res.status(500).json({ error: "Failed to fetch areas" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const area = await prisma.growArea.findUnique({
      where: { id },
      include: areaIncludes,
    });
    if (!area) return res.status(404).json({ error: "Area not found" });
    res.json(serializeArea(area));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch area" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, type, description, lightSchedule, isActive } = req.body;
    if (!name) return res.status(400).json({ error: "Area name is required" });

    const area = await prisma.growArea.create({
      data: {
        name,
        type: type || "tent",
        description: description || null,
        lightSchedule: lightSchedule || null,
        isActive: isActive ?? true,
      },
      include: areaIncludes,
    });
    res.status(201).json(serializeArea(area));
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Area name already exists" });
    }
    console.error("🔴 [Areas] Failed to create area:", error.message);
    res.status(500).json({ error: "Failed to create area", details: error.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, type, description, lightSchedule, isActive } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (description !== undefined) data.description = description;
    if (lightSchedule !== undefined) data.lightSchedule = lightSchedule;
    if (isActive !== undefined) data.isActive = isActive;

    const area = await prisma.growArea.update({
      where: { id },
      data,
      include: areaIncludes,
    });
    res.json(serializeArea(area));
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ error: "Area not found" });
    if (error.code === "P2002") return res.status(409).json({ error: "Area name already exists" });
    console.error("🔴 [Areas] Failed to update area:", error.message);
    res.status(500).json({ error: "Failed to update area" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.growArea.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ error: "Area not found" });
    console.error("Delete area error:", error);
    res.status(500).json({ error: "Failed to delete area" });
  }
});

// Area Events
router.get("/:id/events", async (req: Request, res: Response) => {
  try {
    const areaId = parseInt(req.params.id);
    const { type, from, to, limit = "100", offset = "0" } = req.query;

    const where: any = { areaId };
    if (type) where.type = type as string;
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from as string);
      if (to) where.timestamp.lte = new Date(to as string);
    }

    const events = await prisma.areaEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });
    res.json(events.map(serializeEvent));
  } catch (error) {
    console.error("Failed to fetch area events:", error);
    res.status(500).json({ error: "Failed to fetch area events" });
  }
});

router.post("/:id/events", async (req: Request, res: Response) => {
  try {
    const areaId = parseInt(req.params.id);
    const { type, title, data, notes, timestamp, source } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: "type and title are required" });
    }

    const area = await prisma.growArea.findUnique({ where: { id: areaId } });
    if (!area) return res.status(404).json({ error: "Area not found" });

    const event = await prisma.areaEvent.create({
      data: {
        areaId,
        type,
        title,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        notes: notes || null,
        data: data ? JSON.stringify(data) : null,
        source: source || "manual",
      },
    });

    // If this is a light_schedule event, update the area's current lightSchedule
    if (type === "light_schedule" && data?.schedule) {
      await prisma.growArea.update({
        where: { id: areaId },
        data: { lightSchedule: data.schedule },
      });
    }

    res.status(201).json(serializeEvent(event));
  } catch (error) {
    console.error("Failed to create area event:", error);
    res.status(500).json({ error: "Failed to create area event" });
  }
});

router.put("/:id/events/:eventId", async (req: Request, res: Response) => {
  try {
    const areaId = parseInt(req.params.id);
    const eventId = parseInt(req.params.eventId);
    const { type, title, data, notes, timestamp } = req.body;

    const existing = await prisma.areaEvent.findFirst({ where: { id: eventId, areaId } });
    if (!existing) return res.status(404).json({ error: "Event not found" });

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (timestamp !== undefined) updateData.timestamp = new Date(timestamp);
    if (data !== undefined) updateData.data = data ? JSON.stringify(data) : null;

    const event = await prisma.areaEvent.update({
      where: { id: eventId },
      data: updateData,
    });

    // Sync area lightSchedule when editing a light_schedule event
    if (event.type === 'light_schedule' && data?.schedule) {
      await prisma.growArea.update({
        where: { id: areaId },
        data: { lightSchedule: data.schedule },
      });
    }

    res.json(serializeEvent(event));
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ error: "Event not found" });
    console.error("Failed to update area event:", error);
    res.status(500).json({ error: "Failed to update area event" });
  }
});

router.delete("/:id/events/:eventId", async (req: Request, res: Response) => {
  try {
    const areaId = parseInt(req.params.id);
    const eventId = parseInt(req.params.eventId);

    const toDelete = await prisma.areaEvent.findFirst({ where: { id: eventId, areaId } });
    if (!toDelete) return res.status(404).json({ error: "Event not found" });

    await prisma.areaEvent.delete({ where: { id: eventId } });

    // Recompute area lightSchedule if we deleted a light_schedule event
    if (toDelete.type === 'light_schedule') {
      const latest = await prisma.areaEvent.findFirst({
        where: { areaId, type: 'light_schedule' },
        orderBy: { timestamp: 'desc' },
      });
      const schedule = latest?.data ? JSON.parse(latest.data).schedule ?? null : null;
      await prisma.growArea.update({
        where: { id: areaId },
        data: { lightSchedule: schedule },
      });
    }

    res.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ error: "Event not found" });
    console.error("Failed to delete area event:", error);
    res.status(500).json({ error: "Failed to delete area event" });
  }
});

// Assign plant to area
router.post("/:id/plants", async (req: Request, res: Response) => {
  try {
    const areaId = parseInt(req.params.id);
    const { plantId } = req.body;

    if (!plantId) return res.status(400).json({ error: "plantId required" });

    const area = await prisma.growArea.findUnique({ where: { id: areaId } });
    if (!area) return res.status(404).json({ error: "Area not found" });

    const plant = await prisma.plant.findUnique({ where: { id: plantId } });
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    await prisma.plant.update({
      where: { id: plantId },
      data: { areaId },
    });

    const updated = await prisma.growArea.findUnique({
      where: { id: areaId },
      include: areaIncludes,
    });
    res.json(serializeArea(updated));
  } catch (error) {
    console.error("Failed to assign plant to area:", error);
    res.status(500).json({ error: "Failed to assign plant" });
  }
});

// Remove plant from area
router.delete("/:id/plants/:plantId", async (req: Request, res: Response) => {
  try {
    const areaId = parseInt(req.params.id);
    const plantId = parseInt(req.params.plantId);

    const area = await prisma.growArea.findUnique({ where: { id: areaId } });
    if (!area) return res.status(404).json({ error: "Area not found" });

    const plant = await prisma.plant.findUnique({ where: { id: plantId } });
    if (!plant || plant.areaId !== areaId) return res.status(404).json({ error: "Plant not found" });

    await prisma.plant.update({
      where: { id: plantId },
      data: { areaId: null },
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ error: "Plant not found" });
    console.error("Failed to remove plant from area:", error);
    res.status(500).json({ error: "Failed to remove plant" });
  }
});

// Flip light schedule + optional bulk phase transition
router.post("/:id/flip", async (req: Request, res: Response) => {
  try {
    const areaId = parseInt(req.params.id);
    const { newSchedule, transitionPlants = false, timestamp } = req.body;

    if (!newSchedule) return res.status(400).json({ error: "newSchedule required" });

    const area = await prisma.growArea.findUnique({
      where: { id: areaId },
      include: {
        plants: {
          where: { isActive: true },
          include: {
            strain: true,
            phases: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
    if (!area) return res.status(404).json({ error: "Area not found" });

    const previousSchedule = area.lightSchedule;
    const flipTime = timestamp ? new Date(timestamp) : new Date();

    const transitioned = await prisma.$transaction(async (tx) => {
      await tx.areaEvent.create({
        data: {
          areaId,
          type: "light_schedule",
          title: previousSchedule ? `Flip: ${previousSchedule} → ${newSchedule}` : `Set schedule: ${newSchedule}`,
          timestamp: flipTime,
          data: JSON.stringify({
            schedule: newSchedule,
            previous_schedule: previousSchedule,
          }),
        },
      });

      await tx.growArea.update({
        where: { id: areaId },
        data: { lightSchedule: newSchedule },
      });

      const ids: number[] = [];

      if (transitionPlants) {
        for (const plant of area.plants) {
          const isPhotoperiod = plant.strain?.type === "photoperiod" || !plant.strain;
          if (!isPhotoperiod) continue;

          const phases = plant.phases.sort((a, b) => a.sortOrder - b.sortOrder);
          const currentPhase = getCurrentPhase(phases);
          if (!currentPhase) continue;

          const currentIdx = phases.findIndex((p) => p.id === currentPhase.id);
          if (currentIdx === -1 || currentIdx >= phases.length - 1) continue;

          const nextPhase = phases[currentIdx + 1];
          await tx.plantPhase.update({
            where: { id: nextPhase.id },
            data: { startDate: flipTime, isActive: true },
          });
          await tx.plantPhase.update({
            where: { id: currentPhase.id },
            data: { isCompleted: true, isActive: false },
          });
          ids.push(plant.id);
        }
      }

      return ids;
    });

    const updated = await prisma.growArea.findUnique({
      where: { id: areaId },
      include: areaIncludes,
    });
    res.json({
      area: serializeArea(updated),
      transitioned,
    });
  } catch (error) {
    console.error("Failed to flip area:", error);
    res.status(500).json({ error: "Failed to flip area" });
  }
});

// Aggregated environment data for charts
router.get("/:id/environment", async (req: Request, res: Response) => {
  try {
    const areaId = parseInt(req.params.id);
    const { range = "7d" } = req.query;

    const now = new Date();
    const from = new Date();
    const rangeStr = range as string;
    if (rangeStr === "24h") from.setHours(now.getHours() - 24);
    else if (rangeStr === "7d") from.setDate(now.getDate() - 7);
    else if (rangeStr === "30d") from.setDate(now.getDate() - 30);
    else from.setFullYear(2000); // all

    const events = await prisma.areaEvent.findMany({
      where: {
        areaId,
        type: "environment",
        timestamp: { gte: from },
      },
      orderBy: { timestamp: 'asc' },
    });

    const series = events.map(serializeEvent);
    res.json({ range: rangeStr, from: from.toISOString(), to: now.toISOString(), series });
  } catch (error) {
    console.error("Failed to fetch environment data:", error);
    res.status(500).json({ error: "Failed to fetch environment data" });
  }
});

export { router as areaRoutes };
