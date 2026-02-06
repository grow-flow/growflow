import { Router, Request, Response } from "express";
import { prisma } from "../database";
import { createPlantPhasesFromStrain, getCurrentPhase } from "../utils/phaseUtils";

const router = Router();

const plantIncludes = { strain: true, phases: true, events: true };

router.get("/", async (_req: Request, res: Response) => {
  try {
    const plants = await prisma.plant.findMany({
      where: { isActive: true },
      include: plantIncludes,
    });
    res.json(plants);
  } catch (error) {
    console.error("🔴 [Plants] Error fetching plants:", error);
    res.status(500).json({ error: "Failed to fetch plants" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const plant = await prisma.plant.findUnique({
      where: { id },
      include: plantIncludes,
    });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    res.json(plant);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch plant" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    let strainId: number | undefined = undefined;
    let isAutoflower = req.body.plant_type === "autoflower";

    if (req.body.strainId) {
      strainId = req.body.strainId;
      const strain = await prisma.strain.findUnique({ where: { id: strainId } });
      if (strain?.type === "autoflower") isAutoflower = true;
    } else if (req.body.strain) {
      const strain = await prisma.strain.findFirst({ where: { name: req.body.strain } });
      if (strain) {
        strainId = strain.id;
        if (strain.type === "autoflower") isAutoflower = true;
      }
    }

    const phasesData = req.body.phases || createPlantPhasesFromStrain([], isAutoflower);

    const plant = await prisma.plant.create({
      data: {
        name: req.body.name,
        strainId,
        notes: req.body.notes || "",
        isActive: req.body.isActive ?? true,
        phases: {
          create: phasesData.map((p: any, index: number) => ({
            name: p.name,
            durationMin: p.durationMin ?? p.duration_min ?? 7,
            durationMax: p.durationMax ?? p.duration_max ?? 14,
            startDate: index === 0 ? new Date() : null,
            isActive: index === 0,
            isCompleted: false,
            notes: p.notes || null,
          })),
        },
      },
      include: plantIncludes,
    });

    res.status(201).json(plant);
  } catch (error: any) {
    console.error("🔴 [Plants] Failed to create plant:", error.message);
    res.status(500).json({ error: "Failed to create plant", details: error.message });
  }
});

router.put("/:id/phases", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { phases } = req.body;

    if (!Array.isArray(phases) || phases.length === 0) {
      return res.status(400).json({ error: "Invalid phases data" });
    }

    const plant = await prisma.plant.findUnique({ where: { id } });
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    await prisma.plantPhase.deleteMany({ where: { plantId: id } });

    await prisma.plantPhase.createMany({
      data: phases.map((p: any) => ({
        plantId: id,
        name: p.name,
        durationMin: p.durationMin ?? p.duration_min ?? 7,
        durationMax: p.durationMax ?? p.duration_max ?? 14,
        startDate: p.startDate ? new Date(p.startDate) : null,
        isActive: p.isActive ?? p.is_active ?? false,
        isCompleted: p.isCompleted ?? p.is_completed ?? false,
        notes: p.notes || null,
      })),
    });

    const updated = await prisma.plant.findUnique({
      where: { id },
      include: plantIncludes,
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Failed to update plant phases:", error);
    res.status(500).json({ error: "Failed to update plant phases" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { phases, events, strain, ...rest } = req.body;

    const data: any = { ...rest };
    if (rest.strainId !== undefined) data.strainId = rest.strainId;

    const plant = await prisma.plant.update({
      where: { id },
      data,
      include: plantIncludes,
    });

    res.json(plant);
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Plant not found" });
    }
    console.error(`🔴 [Plants] Failed to update plant ${req.params.id}:`, error.message);
    res.status(500).json({ error: "Failed to update plant", details: error.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.plant.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Plant not found" });
    }
    console.error("Delete plant error:", error);
    res.status(500).json({ error: "Failed to delete plant" });
  }
});

router.post("/:id/events", async (req: Request, res: Response) => {
  try {
    const plantId = parseInt(req.params.id);
    const { type, title, data, notes, timestamp } = req.body;

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: { phases: true },
    });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    const currentPhase = getCurrentPhase(plant.phases);

    await prisma.plantEvent.create({
      data: {
        plantId,
        phaseId: currentPhase?.id ?? null,
        type,
        title,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        notes: notes || null,
        data: data ? JSON.stringify(data) : null,
      },
    });

    const updated = await prisma.plant.findUnique({
      where: { id: plantId },
      include: plantIncludes,
    });

    res.status(201).json(updated);
  } catch (error) {
    console.error("Failed to create event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.put("/:id/events/:eventId", async (req: Request, res: Response) => {
  try {
    const plantId = parseInt(req.params.id);
    const eventId = parseInt(req.params.eventId);
    const { type, title, data, notes, timestamp } = req.body;

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (timestamp !== undefined) updateData.timestamp = new Date(timestamp);
    if (data !== undefined) updateData.data = JSON.stringify(data);

    await prisma.plantEvent.update({
      where: { id: eventId },
      data: updateData,
    });

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: plantIncludes,
    });

    res.json(plant);
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Event not found" });
    }
    console.error("Failed to update event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/:id/events/:eventId", async (req: Request, res: Response) => {
  try {
    const plantId = parseInt(req.params.id);
    const eventId = parseInt(req.params.eventId);

    await prisma.plantEvent.delete({ where: { id: eventId } });

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: plantIncludes,
    });

    res.json(plant);
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Event not found" });
    }
    console.error("Failed to delete event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export { router as plantRoutes };
