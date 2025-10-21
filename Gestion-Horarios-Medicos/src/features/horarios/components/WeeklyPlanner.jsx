import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import dayjs from "dayjs";

import {
  crearDisponibilidad,
  eliminarDisponibilidad,
  haySolape,
  listarDisponibilidadPorDoctor,
} from "@/services/disponibilidad.js";
import { humanizeError } from "@/utils/errorMap.js";

const HOURS_START = 8;
const HOURS_END = 20;
const SLOT_MINUTES = 30;
const SLOT_COUNT = ((HOURS_END - HOURS_START) * 60) / SLOT_MINUTES;
const SLOT_HEIGHT = 44;
const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function formatHourLabel(index) {
  const totalMinutes = HOURS_START * 60 + index * SLOT_MINUTES;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function normalizeDuration(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return SLOT_MINUTES;
  }
  return parsed;
}

export default function WeeklyPlanner({ doctorId, weekStart, onChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slots, setSlots] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState(null);
  const [durationInput, setDurationInput] = useState(SLOT_MINUTES);
  const [dialogSubmitting, setDialogSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const weekStartDate = useMemo(() => {
    if (!weekStart) {
      return null;
    }
    if (weekStart instanceof Date) {
      return new Date(weekStart);
    }
    if (typeof weekStart?.toDate === "function") {
      return weekStart.toDate();
    }
    return new Date(weekStart);
  }, [weekStart]);

  const weekStartDayjs = useMemo(() => {
    if (!weekStartDate) {
      return null;
    }
    return dayjs(weekStartDate);
  }, [weekStartDate]);

  const weekDays = useMemo(() => {
    if (!weekStartDayjs) {
      return [];
    }
    return Array.from({ length: 7 }, (_, index) => weekStartDayjs.add(index, "day"));
  }, [weekStartDayjs]);

  const timeSlots = useMemo(
    () => Array.from({ length: SLOT_COUNT }, (_, index) => formatHourLabel(index)),
    [],
  );

  const fetchSlots = useCallback(async () => {
    if (!doctorId || !weekStartDate) {
      setSlots([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await listarDisponibilidadPorDoctor(doctorId, weekStartDate);
      setSlots(data ?? []);
    } catch (fetchError) {
      setError(fetchError?.message || "No se pudieron cargar los bloques de disponibilidad.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId, weekStartDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    if (!dialogOpen) {
      setDurationInput(SLOT_MINUTES);
      setPendingRange(null);
    }
  }, [dialogOpen]);

  const slotsByDay = useMemo(() => {
    if (!weekStartDate) {
      return [];
    }

    const groups = Array.from({ length: 7 }, () => []);
    const mondayUtc = Date.UTC(
      weekStartDate.getFullYear(),
      weekStartDate.getMonth(),
      weekStartDate.getDate(),
    );

    slots.forEach((slot) => {
      const inicioLocal = new Date(slot.fecha_hora_inicio);
      const finLocal = new Date(slot.fecha_hora_fin);
      if (Number.isNaN(inicioLocal?.getTime?.()) || Number.isNaN(finLocal?.getTime?.())) {
        return;
      }

      const startOfDay = new Date(inicioLocal);
      startOfDay.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (Date.UTC(
          startOfDay.getFullYear(),
          startOfDay.getMonth(),
          startOfDay.getDate(),
        ) - mondayUtc) /
          86400000,
      );

      if (diffDays >= 0 && diffDays < 7) {
        groups[diffDays].push({
          ...slot,
          inicioLocal,
          finLocal,
        });
      }
    });

    groups.forEach((daySlots) => {
      daySlots.sort((a, b) => a.inicioLocal.getTime() - b.inicioLocal.getTime());
    });

    return groups;
  }, [slots, weekStartDate]);

  const getCellRange = useCallback(
    (dayIndex, slotIndex) => {
      if (weekStartDate == null) {
        return null;
      }
      const start = new Date(weekStartDate);
      start.setDate(start.getDate() + dayIndex);
      start.setHours(HOURS_START, 0, 0, 0);
      start.setMinutes(start.getMinutes() + slotIndex * SLOT_MINUTES);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + SLOT_MINUTES);
      return { start, end };
    },
    [weekStartDate],
  );

  const isCellTaken = useCallback(
    (dayIndex, slotIndex) => {
      const range = getCellRange(dayIndex, slotIndex);
      if (!range) {
        return false;
      }
      return (slotsByDay?.[dayIndex] ?? []).some((slot) =>
        overlaps(range.start, range.end, slot.inicioLocal, slot.finLocal),
      );
    },
    [getCellRange, slotsByDay],
  );

  const finalizeSelection = useCallback(() => {
    setSelecting(false);
    setSelection((current) => {
      if (!current || !weekStartDayjs) {
        return null;
      }

      const { dayIndex, startSlot, endSlot } = current;
      if (dayIndex == null) {
        return null;
      }

      const normalizedStart = Math.max(Math.min(startSlot, SLOT_COUNT - 1), 0);
      const normalizedEnd = Math.max(Math.min(endSlot, SLOT_COUNT - 1), 0);
      const slotStart = Math.min(normalizedStart, normalizedEnd);
      const slotEnd = Math.max(normalizedStart, normalizedEnd) + 1;

      if (slotEnd <= slotStart) {
        return null;
      }

      const dayStart = weekStartDayjs.add(dayIndex, "day").startOf("day");
      const inicio = dayStart.add(HOURS_START, "hour").add(slotStart * SLOT_MINUTES, "minute");
      const fin = dayStart.add(HOURS_START, "hour").add(slotEnd * SLOT_MINUTES, "minute");

      if (!fin.isAfter(inicio)) {
        setFeedback({ type: "error", message: "El fin debe ser posterior al inicio." });
        return null;
      }

      const existing = (slotsByDay?.[dayIndex] ?? []).map((item) => ({
        fecha_hora_inicio: item.inicioLocal,
        fecha_hora_fin: item.finLocal,
      }));

      if (haySolape(inicio, fin, existing)) {
        setFeedback({ type: "error", message: "El bloque seleccionado se solapa con otro existente." });
        return null;
      }

      setPendingRange({ dayIndex, inicio, fin });
      setDialogOpen(true);
      return null;
    });
  }, [slotsByDay, weekStartDayjs]);

  const handleCellMouseDown = (dayIndex, slotIndex, taken) => {
    if (editMode) {
      return; // en edición no se crean bloques nuevos
    }
    if (!doctorId) {
      setFeedback({ type: "warning", message: "Selecciona un doctor antes de crear bloques." });
      return;
    }
    if (!weekStartDayjs) {
      return;
    }
    if (taken) {
      setFeedback({ type: "warning", message: "Ese bloque ya está ocupado." });
      return;
    }

    setFeedback(null);
    setSelecting(true);
    setSelection({ dayIndex, startSlot: slotIndex, endSlot: slotIndex });
  };

  const handleCellMouseEnter = (dayIndex, slotIndex) => {
    if (editMode) {
      return; // no extender selección en edición
    }
    setSelection((current) => {
      if (!selecting || !current || current.dayIndex !== dayIndex) {
        return current;
      }
      if (isCellTaken(dayIndex, slotIndex)) {
        return current;
      }
      return { ...current, endSlot: slotIndex };
    });
  };

  const handleGridMouseUp = () => {
    if (selecting) {
      finalizeSelection();
    }
  };

  const handleGridMouseLeave = () => {
    if (selecting) {
      finalizeSelection();
    }
  };

  const isCellSelected = (dayIndex, slotIndex) => {
    if (!selecting || !selection || selection.dayIndex !== dayIndex) {
      return false;
    }
    const start = Math.min(selection.startSlot, selection.endSlot);
    const end = Math.max(selection.startSlot, selection.endSlot);
    return slotIndex >= start && slotIndex <= end;
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setPendingRange(null);
  };

  const handleCreate = async () => {
    if (!pendingRange || !doctorId) {
      return;
    }

    const { inicio, fin } = pendingRange;
    const duration = normalizeDuration(durationInput);

    setDialogSubmitting(true);
    setFeedback(null);
    try {
      await crearDisponibilidad({
        doctor_id: doctorId,
        fecha_hora_inicio: inicio.toDate(),
        fecha_hora_fin: fin.toDate(),
        duracion_bloque_minutos: duration,
      });
      await fetchSlots();
      setDialogOpen(false);
      onChange?.();
      setFeedback({ type: "success", message: "Bloque creado correctamente." });
    } catch (creationError) {
      setFeedback({ type: "error", message: humanizeError(creationError) });
    } finally {
      setDialogSubmitting(false);
    }
  };

  const handleDeleteClick = (slot) => {
    setDeleteTarget(slot);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleteSubmitting(true);
    setFeedback(null);
    try {
      await eliminarDisponibilidad(deleteTarget.id);
      await fetchSlots();
      setDeleteTarget(null);
      onChange?.();
      setFeedback({ type: "success", message: "Bloque eliminado." });
    } catch (deleteError) {
      setFeedback({ type: "error", message: humanizeError(deleteError) });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Planificador semanal</Typography>
        <ToggleButton
          value="edit"
          selected={editMode}
          size="small"
          onChange={() => setEditMode((prev) => !prev)}
          color="primary"
        >
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Modo edición
        </ToggleButton>
      </Stack>

      {feedback && (
        <Alert severity={feedback.type === "success" ? "success" : feedback.type}>
          {feedback.message}
        </Alert>
      )}

      {!doctorId ? (
        <Alert severity="info">Selecciona un doctor para ver y gestionar su disponibilidad.</Alert>
      ) : loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box
          onMouseUp={handleGridMouseUp}
          onMouseLeave={handleGridMouseLeave}
          sx={{
            overflowX: "auto",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "80px repeat(7, minmax(160px, 1fr))",
              borderBottom: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.default",
            }}
          >
            <Box sx={{ borderRight: "1px solid", borderColor: "divider", p: 1 }} />
            {weekDays.map((day, index) => (
              <Box
                key={`day-header-${index}`}
                sx={{
                  borderRight: index === 6 ? "none" : "1px solid",
                  borderColor: "divider",
                  textAlign: "center",
                  py: 1,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  {DAY_LABELS[index]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {day.format("DD/MM")}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex" }}>
            <Box sx={{ width: 80, borderRight: "1px solid", borderColor: "divider" }}>
              {timeSlots.map((label, rowIndex) => (
                <Box
                  key={`time-${rowIndex}`}
                  sx={{
                    borderBottom: rowIndex === SLOT_COUNT - 1 ? "none" : "1px solid",
                    borderColor: "divider",
                    height: SLOT_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: rowIndex % 2 === 0 ? "action.hover" : "transparent",
                  }}
                >
                  <Typography variant="caption">{label}</Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${weekDays.length}, minmax(160px, 1fr))`,
                flex: 1,
              }}
            >
              {weekDays.map((_, dayIndex) => (
                <Box
                  key={`day-column-${dayIndex}`}
                  sx={{
                    position: "relative",
                    borderRight: dayIndex === weekDays.length - 1 ? "none" : "1px solid",
                    borderColor: "divider",
                    overflow: "visible",
                  }}
                >
                  {timeSlots.map((_, rowIndex) => {
                    const isSelectedCell = isCellSelected(dayIndex, rowIndex);
                    const taken = isCellTaken(dayIndex, rowIndex);

                    return (
                      <Box
                        key={`cell-${dayIndex}-${rowIndex}`}
                        sx={{
                          borderBottom: rowIndex === SLOT_COUNT - 1 ? "none" : "1px solid",
                          borderColor: "divider",
                          height: SLOT_HEIGHT,
                          backgroundColor: isSelectedCell
                            ? "action.selected"
                            : taken
                            ? "action.disabledBackground"
                            : rowIndex % 2 === 0
                            ? "background.paper"
                            : "background.default",
                          cursor: doctorId && !taken ? "crosshair" : "not-allowed",
                        }}
                        onMouseDown={() => handleCellMouseDown(dayIndex, rowIndex, taken)}
                        onMouseEnter={() => handleCellMouseEnter(dayIndex, rowIndex)}
                      />
                    );
                  })}

                  {(slotsByDay?.[dayIndex] ?? []).map((slot) => {
                    const startMinutes = slot.inicioLocal.getHours() * 60 + slot.inicioLocal.getMinutes();
                    const endMinutes = slot.finLocal.getHours() * 60 + slot.finLocal.getMinutes();
                    const relativeStart = startMinutes - HOURS_START * 60;
                    const relativeEnd = endMinutes - HOURS_START * 60;
                    const clampedStart = Math.max(relativeStart, 0);
                    const clampedEnd = Math.min(relativeEnd, (HOURS_END - HOURS_START) * 60);
                    if (clampedEnd <= clampedStart) {
                      return null;
                    }

                    const top = (clampedStart / SLOT_MINUTES) * SLOT_HEIGHT;
                    const height = Math.max(((clampedEnd - clampedStart) / SLOT_MINUTES) * SLOT_HEIGHT - 6, SLOT_HEIGHT - 12);

                    return (
                      <Box
                        key={slot.id}
                        className={`slot-badge${editMode ? " editable" : ""}`}
                        sx={{
                          position: "absolute",
                          top,
                          left: 8,
                          right: 8,
                          height,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: editMode ? "auto" : "none",
                          textAlign: "center",
                          px: 1,
                          zIndex: 3, // refuerzo visual
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {`${dayjs(slot.inicioLocal).format("HH:mm")}–${dayjs(slot.finLocal).format("HH:mm")}`}
                        </Typography>
                        {editMode && (
                          <Tooltip title="Eliminar bloque">
                            <IconButton
                              size="small"
                              className="delete-icon"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteClick(slot);
                              }}
                              sx={{ pointerEvents: "auto" }}
                            >
                              <CloseIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar bloque</DialogTitle>
        <DialogContent>
          {pendingRange && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography>
                {`Bloque seleccionado: ${pendingRange.inicio.format("dddd DD/MM HH:mm")} - ${pendingRange.fin.format("HH:mm")}`}
              </Typography>
              <TextField
                label="Duración bloque (min)"
                type="number"
                value={durationInput}
                onChange={(event) => setDurationInput(event.target.value)}
                inputProps={{ min: 5, step: 5 }}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={dialogSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={dialogSubmitting}>
            {dialogSubmitting ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar bloque</DialogTitle>
        <DialogContent>
          {deleteTarget && (
            <Typography>
              ¿Eliminar el bloque {dayjs(deleteTarget?.inicioLocal).format("DD/MM HH:mm")} –
              {dayjs(deleteTarget?.finLocal).format("HH:mm")}? Esta acción no se puede deshacer.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteSubmitting}
          >
            {deleteSubmitting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
