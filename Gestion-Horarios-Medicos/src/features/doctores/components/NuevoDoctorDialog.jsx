import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { crearDoctorConUsuario, listarEspecialidadesPrincipales } from "@/services/doctores.js";
import { cleanRutValue, formatRutForDisplay } from "@/utils/rut";

const schema = yup.object({
  nombre: yup.string().required("Nombre obligatorio").min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  apellido_paterno: yup.string().required("Apellido paterno obligatorio").min(2).max(100),
  apellido_materno: yup.string().nullable(),
  rut: yup.string().required("RUT obligatorio"),
  email: yup.string().required("Email obligatorio").email("Email inválido"),
  telefono_principal: yup.string().nullable(),
  telefono_secundario: yup.string().nullable(),
  direccion: yup.string().nullable(),
  especialidad_principal: yup.string().required("Selecciona una especialidad"),
  password_temporal: yup.string().nullable(),
});

const defaultValues = {
  nombre: "",
  apellido_paterno: "",
  apellido_materno: "",
  rut: "",
  email: "",
  telefono_principal: "",
  telefono_secundario: "",
  direccion: "",
  especialidad_principal: "",
  password_temporal: "",
};

export default function NuevoDoctorDialog({ open, onClose, onCreated }) {
  const [especialidades, setEspecialidades] = useState([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setSubmitError("");
      return;
    }

    let active = true;
    const fetchEspecialidades = async () => {
      setLoadingEspecialidades(true);
      setSubmitError("");
      try {
        const data = await listarEspecialidadesPrincipales();
        if (active) setEspecialidades(data);
      } catch (err) {
        if (active) setSubmitError(err?.message || "No se pudieron cargar las especialidades");
      } finally {
        if (active) setLoadingEspecialidades(false);
      }
    };

    fetchEspecialidades();
    return () => { active = false; };
  }, [open, reset]);

  const especialidadesOptions = useMemo(
    () => especialidades.map((item) => ({ value: item.nombre, label: item.nombre })),
    [especialidades]
  );

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      const persona = {
        nombre: values.nombre.trim(),
        apellido_paterno: values.apellido_paterno.trim(),
        apellido_materno: values.apellido_materno?.trim() || null,
        rut: cleanRutValue(values.rut),
        email: values.email.trim(),
        telefono_principal: values.telefono_principal?.trim() || null,
        telefono_secundario: values.telefono_secundario?.trim() || null,
        direccion: values.direccion?.trim() || null,
      };

      const doctor = {
        especialidad_principal: values.especialidad_principal.trim(),
      };

      const credenciales = {};
      if (values.password_temporal && values.password_temporal.trim()) {
        credenciales.password = values.password_temporal.trim();
      }

      const resultado = await crearDoctorConUsuario({ persona, doctor, credenciales, actor_uuid: null });
      reset(defaultValues);
      onCreated?.(resultado);
    } catch (err) {
      if (err?.code === "AUTH_EMAIL_DUPLICATE") {
        setSubmitError("Ese correo ya se encuentra registrado. Usa uno distinto o recupera el acceso existente.");
        return;
      }
      setSubmitError(err?.message || "No se pudo crear el doctor. Intenta nuevamente.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2 },
        sx: { borderRadius: 4 },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 2 }}>
        Nuevo doctor
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Box component="form" id="nuevo-doctor-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5} columns={{ xs: 1, sm: 12 }}>
            <Grid item xs={1} sm={6}>
              <Stack spacing={2}>
                <Controller
                  name="nombre"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Nombre" required error={!!errors.nombre} helperText={errors.nombre?.message} />
                  )}
                />
                <Controller
                  name="apellido_paterno"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Apellido paterno" required error={!!errors.apellido_paterno} helperText={errors.apellido_paterno?.message} />
                  )}
                />
                <Controller
                  name="apellido_materno"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Apellido materno (opcional)" error={!!errors.apellido_materno} helperText={errors.apellido_materno?.message} />
                  )}
                />
                <Controller
                  name="rut"
                  control={control}
                  render={({ field }) => {
                    const { onChange, value, ref, ...rest } = field;
                    return (
                      <TextField
                        {...rest}
                        inputRef={ref}
                        value={formatRutForDisplay(value)}
                        label="RUT"
                        required
                        error={!!errors.rut}
                        helperText={errors.rut?.message}
                        inputProps={{ inputMode: "numeric", pattern: "[0-9kK]*", maxLength: 12 }}
                        onChange={(e) => {
                          const cleaned = cleanRutValue(e.target.value || "");
                          onChange(cleaned);
                        }}
                      />
                    );
                  }}
                />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Email" required error={!!errors.email} helperText={errors.email?.message} />
                  )}
                />
                <Controller
                  name="password_temporal"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Contraseña temporal (opcional)"
                      placeholder="Si no la proporcionas, se generará una"
                      type="text"
                    />
                  )}
                />
              </Stack>
            </Grid>

            <Grid item xs={1} sm={6}>
              <Stack spacing={2}>
                <Controller
                  name="telefono_principal"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Teléfono principal"
                      error={!!errors.telefono_principal}
                      helperText={errors.telefono_principal?.message}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 9 }}
                      onChange={(e) => {
                        const digits = (e.target.value || "").replace(/\D+/g, "");
                        field.onChange(digits);
                      }}
                    />
                  )}
                />
                <Controller
                  name="telefono_secundario"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Teléfono secundario"
                      error={!!errors.telefono_secundario}
                      helperText={errors.telefono_secundario?.message}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 9 }}
                      onChange={(e) => {
                        const digits = (e.target.value || "").replace(/\D+/g, "");
                        field.onChange(digits);
                      }}
                    />
                  )}
                />
                <Controller
                  name="direccion"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Dirección" error={!!errors.direccion} helperText={errors.direccion?.message} />
                  )}
                />
                <FormControl fullWidth error={!!errors.especialidad_principal} disabled={loadingEspecialidades}>
                  <InputLabel id="especialidad-label">Especialidad</InputLabel>
                  <Controller
                    name="especialidad_principal"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        labelId="especialidad-label"
                        label="Especialidad"
                        MenuProps={{
                          MenuListProps: {
                            dense: true,
                          },
                        }}
                      >
                        {especialidadesOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.especialidad_principal && <FormHelperText>{errors.especialidad_principal.message}</FormHelperText>}
                  {loadingEspecialidades && <FormHelperText>Cargando especialidades...</FormHelperText>}
                </FormControl>
              </Stack>
            </Grid>
          </Grid>
        </Box>
        {!!submitError && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {submitError}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" form="nuevo-doctor-form" variant="contained" disabled={isSubmitting}>
          Crear doctor
        </Button>
      </DialogActions>
    </Dialog>
  );
}
