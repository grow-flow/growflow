import { Router, Request, Response } from "express";
import { AppDataSource } from "../database";
import { Plant, Strain } from "../models";
import {
  createPlantPhasesFromStrain,
  getCurrentPhase,
  startNextPhase,
  updatePhaseStartDate,
} from "../utils/phaseUtils";
import {
  createEvent,
  addEventToPlant,
  updateEvent,
  deleteEvent,
} from "../utils/eventUtils";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const plants = await AppDataSource.getRepository(Plant).find({
      where: { is_active: true },
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
    const plant = await AppDataSource.getRepository(Plant).findOne({
      where: { id },
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
    const plantRepo = AppDataSource.getRepository(Plant);
    const strainRepo = AppDataSource.getRepository(Strain);

    // Get strain to determine plant type
    let strain = null;
    if (req.body.strain) {
      strain = await strainRepo.findOne({ where: { name: req.body.strain } });
    }

    // Use phases from request if provided, otherwise create from plant type
    const isAutoflower =
      req.body.plant_type === "autoflower" || strain?.type === "autoflower";
    const phases =
      req.body.phases || createPlantPhasesFromStrain([], isAutoflower);

    const plant = plantRepo.create({
      ...req.body,
      phases,
    });

    const saved = await plantRepo.save(plant);
    const savedPlant = Array.isArray(saved) ? saved[0] : saved;

    res.status(201).json(savedPlant);
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

    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    // Validate phases array
    if (!Array.isArray(phases) || phases.length === 0) {
      return res.status(400).json({ error: "Invalid phases data" });
    }

    // Update plant phases - all logic is derived from the dates in the phases
    plant.phases = phases;

    const saved = await plantRepo.save(plant);
    res.json(saved);
  } catch (error) {
    console.error("Failed to update plant phases:", error);
    res.status(500).json({ error: "Failed to update plant phases" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const plantRepo = AppDataSource.getRepository(Plant);

    await plantRepo.update(id, req.body);
    const updated = await plantRepo.findOne({ where: { id } });

    if (!updated) {
      return res.status(404).json({ error: "Plant not found" });
    }

    res.json(updated);
  } catch (error: any) {
    console.error(
      `🔴 [Plants] Failed to update plant ${req.params.id}:`,
      error.message
    );
    res.status(500).json({
      error: "Failed to update plant",
      details: error.message,
    });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const plantRepo = AppDataSource.getRepository(Plant);

    const result = await plantRepo.delete(id);
    if (result.affected === 0) {
      return res.status(404).json({ error: "Plant not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Delete plant error:", error);
    res.status(500).json({ error: "Failed to delete plant" });
  }
});

// Event management endpoints
router.post("/:id/events", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { type, title, data, notes, timestamp } = req.body;

    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    // Get current phase ID for event linking
    const currentPhase = getCurrentPhase(plant.phases);
    const newEvent = createEvent(
      type,
      title,
      data,
      notes,
      currentPhase?.id,
      timestamp
    );

    plant.events = addEventToPlant(plant.events, newEvent);

    const saved = await plantRepo.save(plant);
    res.status(201).json(saved);
  } catch (error) {
    console.error("Failed to create event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.put("/:id/events/:eventId", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { eventId } = req.params;

    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    plant.events = updateEvent(plant.events, eventId, req.body);

    const saved = await plantRepo.save(plant);
    res.json(saved);
  } catch (error) {
    console.error("Failed to update event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/:id/events/:eventId", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { eventId } = req.params;

    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    plant.events = deleteEvent(plant.events, eventId);

    const saved = await plantRepo.save(plant);
    res.json(saved);
  } catch (error) {
    console.error("Failed to delete event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export { router as plantRoutes };
