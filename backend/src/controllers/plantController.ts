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
    console.log("Creating plant with data:", JSON.stringify(req.body, null, 2));

    const plantRepo = AppDataSource.getRepository(Plant);
    const strainRepo = AppDataSource.getRepository(Strain);

    // Get strain to copy phase templates
    let strain = null;
    if (req.body.strain) {
      strain = await strainRepo.findOne({ where: { name: req.body.strain } });
    }

    // Use phases from request if provided, otherwise create from strain
    const phases = req.body.phases || createPlantPhasesFromStrain(
      strain?.phase_templates || [],
      strain?.is_autoflower || false
    );

    const plant = plantRepo.create({
      ...req.body,
      phases,
    });

    console.log("Plant entity created:", JSON.stringify(plant, null, 2));

    const saved = await plantRepo.save(plant);
    const savedPlant = Array.isArray(saved) ? saved[0] : saved;

    console.log("Plant saved successfully:", savedPlant.id);
    res.status(201).json(savedPlant);
  } catch (error: any) {
    console.error("Failed to create plant:", {
      error: error.message,
      stack: error.stack,
      code: error.code,
      requestBody: req.body,
    });
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
    console.log(
      `Updating plant ${id} with data:`,
      JSON.stringify(req.body, null, 2)
    );

    const plantRepo = AppDataSource.getRepository(Plant);

    await plantRepo.update(id, req.body);
    const updated = await plantRepo.findOne({ where: { id } });

    if (!updated) {
      console.warn(`Plant ${id} not found for update`);
      return res.status(404).json({ error: "Plant not found" });
    }

    console.log(`Plant ${id} updated successfully`);
    res.json(updated);
  } catch (error: any) {
    console.error(`Failed to update plant ${req.params.id}:`, {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
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
    const { type, title, data, notes } = req.body;

    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    // Get current phase ID for event linking
    const currentPhase = getCurrentPhase(plant.phases);
    const newEvent = createEvent(type, title, data, notes, currentPhase?.id);

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
