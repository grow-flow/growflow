import { Router, Request, Response } from "express";
import { prisma } from "../database";
import {
  createPlantPhasesFromStrain,
  getCurrentPhase,
} from "../utils/phaseUtils";
import {
  createEvent,
  addEventToPlant,
  updateEvent,
  deleteEvent,
} from "../utils/eventUtils";

const router = Router();

// Parse JSON fields for API response
const parseJson = (str: string | null | undefined, fallback: any = []) => {
  if (!str || str === "") return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
};

const parsePlant = (plant: any) => ({
  ...plant,
  phases: parseJson(plant.phases, []),
  events: parseJson(plant.events, []),
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const plants = await prisma.plant.findMany({
      where: { is_active: true },
    });
    res.json(plants.map(parsePlant));
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
    });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    res.json(parsePlant(plant));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch plant" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    let strain = null;
    if (req.body.strain) {
      strain = await prisma.strain.findFirst({
        where: { name: req.body.strain }
      });
    }

    const isAutoflower =
      req.body.plant_type === "autoflower" || strain?.type === "autoflower";
    const phases =
      req.body.phases || createPlantPhasesFromStrain([], isAutoflower);

    const plant = await prisma.plant.create({
      data: {
        name: req.body.name,
        strain: req.body.strain || "",
        start_method: req.body.start_method || "seed",
        plant_type: req.body.plant_type || "photoperiod",
        notes: req.body.notes || "",
        is_active: req.body.is_active ?? true,
        is_mother_plant: req.body.is_mother_plant ?? false,
        phases: JSON.stringify(phases),
        events: Array.isArray(req.body.events) ? JSON.stringify(req.body.events) : "[]",
      },
    });

    res.status(201).json(parsePlant(plant));
  } catch (error: any) {
    console.error("🔴 [Plants] Failed to create plant:", error.message);
    res.status(500).json({
      error: "Failed to create plant",
      details: error.message,
    });
  }
});

router.put("/:id/phases", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { phases } = req.body;

    if (!Array.isArray(phases) || phases.length === 0) {
      return res.status(400).json({ error: "Invalid phases data" });
    }

    const plant = await prisma.plant.update({
      where: { id },
      data: { phases: JSON.stringify(phases) },
    });

    res.json(parsePlant(plant));
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Plant not found" });
    }
    console.error("Failed to update plant phases:", error);
    res.status(500).json({ error: "Failed to update plant phases" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { events, phases, ...rest } = req.body;

    const data: any = { ...rest };
    if (events !== undefined) {
      data.events = Array.isArray(events) ? JSON.stringify(events) : events;
    }
    if (phases !== undefined) {
      data.phases = Array.isArray(phases) ? JSON.stringify(phases) : phases;
    }

    const plant = await prisma.plant.update({
      where: { id },
      data,
    });

    res.json(parsePlant(plant));
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Plant not found" });
    }
    console.error(`🔴 [Plants] Failed to update plant ${req.params.id}:`, error.message);
    res.status(500).json({
      error: "Failed to update plant",
      details: error.message,
    });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.plant.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Plant not found" });
    }
    console.error("Delete plant error:", error);
    res.status(500).json({ error: "Failed to delete plant" });
  }
});

router.post("/:id/events", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { type, title, data, notes, timestamp } = req.body;

    const plant = await prisma.plant.findUnique({
      where: { id },
    });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    const phases = JSON.parse(plant.phases);
    const events = JSON.parse(plant.events);
    const currentPhase = getCurrentPhase(phases);
    const newEvent = createEvent(
      type,
      title,
      data,
      notes,
      currentPhase?.id,
      timestamp
    );

    const updatedEvents = addEventToPlant(events, newEvent);

    const saved = await prisma.plant.update({
      where: { id },
      data: { events: JSON.stringify(updatedEvents) },
    });

    res.status(201).json(parsePlant(saved));
  } catch (error) {
    console.error("Failed to create event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.put("/:id/events/:eventId", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { eventId } = req.params;

    const plant = await prisma.plant.findUnique({
      where: { id },
    });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    const events = JSON.parse(plant.events);
    const updatedEvents = updateEvent(events, eventId, req.body);

    const saved = await prisma.plant.update({
      where: { id },
      data: { events: JSON.stringify(updatedEvents) },
    });

    res.json(parsePlant(saved));
  } catch (error) {
    console.error("Failed to update event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/:id/events/:eventId", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { eventId } = req.params;

    const plant = await prisma.plant.findUnique({
      where: { id },
    });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    const events = JSON.parse(plant.events);
    const updatedEvents = deleteEvent(events, eventId);

    const saved = await prisma.plant.update({
      where: { id },
      data: { events: JSON.stringify(updatedEvents) },
    });

    res.json(parsePlant(saved));
  } catch (error) {
    console.error("Failed to delete event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export { router as plantRoutes };
