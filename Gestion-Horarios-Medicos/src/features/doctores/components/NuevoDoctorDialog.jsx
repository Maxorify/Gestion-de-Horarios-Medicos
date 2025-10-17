import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { crearDoctor, listarEspecialidadesPrincipales } from "@/services/doctores.js";

const schema = yup.object({
  nombre: yup.string().required("Nombre obligatorio").min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  apellido_paterno: yup.string().required("Apellido paterno obligatorio").min(2).max(100),
  apellido_materno: yup.string().nullable(),
  rut: yup.string().required("RUT obligatorio"),
  email: yup.string().required("Email obligatorio").email("Email inválido"),
  telefono_principal: yup.string().nullable(),
  telefono_secundario: yup.string().nullable(),
  direccion: yup.string().nullable(),
  bio: yup.string().nullable(),
  especialidadesIds: yup
    .array()
    .of(yup.number().integer())
    .min(1, "Selecciona al menos una especialidad"),
  sueldo_base_mensual: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" || originalValue === null ? 0 : value))
    .typeError("Debe ser un número")
    .min(0, "No puede ser negativo"),
  pago_por_atencion: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" || originalValue === null ? 0 : value))
    .typeError("Debe ser un número")
    .min(0, "No puede ser negativo"),
  tope_variable_mensual: yup
    .mixed()
    .test(
      "es-numero-o-vacio",
      "Debe ser un número o dejarlo vacío",
      (value) => value === "" || value === null || (!Number.isNaN(Number(value)) && Number(value) >= 0),
    ),
  avatarFile: yup.mixed().nullable(),
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
  bio: "",
  especialidadesIds: [],
  sueldo_base_mensual: 0,
  pago_por_atencion: 0,
  tope_variable_mensual: "",
  avatarFile: null,
};

export default function NuevoDoctorDialog({ open, onClose, onCreated }) {
  const [especialidades, setEspecialidades] = useState([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const watchAvatar = watch("avatarFile");

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setSubmitError("");
      setAvatarPreview(null);
      return undefined;
    }

    let active = true;

    const fetchEspecialidades = async () => {
      setLoadingEspecialidades(true);
      setSubmitError("");
      try {
        const data = await listarEspecialidadesPrincipales();
        if (active) {
          setEspecialidades(data);
        }
      } catch (err) {
        if (active) {
          setSubmitError(err?.message || "No se pudieron cargar las especialidades");
        }
      } finally {
        if (active) {
          setLoadingEspecialidades(false);
        }
      }
    };

    fetchEspecialidades();

    return () => {
      active = false;
    };
  }, [open, reset]);

  useEffect(() => {
    if (watchAvatar) {
      const objectUrl = URL.createObjectURL(watchAvatar);
      setAvatarPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setAvatarPreview(null);
    return undefined;
  }, [watchAvatar]);

  const especialidadesOptions = useMemo(
    () =>
      especialidades.map((item) => ({
        value: item.id,
        label: item.nombre,
      })),
    [especialidades],
  );

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      const especialidadPrincipalId = Array.isArray(values.especialidadesIds)
        ? values.especialidadesIds[0]
        : null;
      const especialidadPrincipalOption = especialidades.find(
        (item) => item.id === especialidadPrincipalId,
      );

      const persona = {
        nombre: values.nombre.trim(),
        apellido_paterno: values.apellido_paterno.trim(),
        apellido_materno: values.apellido_materno?.trim() || null,
        rut: values.rut.trim(),
        email: values.email.trim(),
        telefono_principal: values.telefono_principal?.trim() || null,
        telefono_secundario: values.telefono_secundario?.trim() || null,
        direccion: values.direccion?.trim() || null,
      };

      const doctor = {
        especialidad_principal: (especialidadPrincipalOption?.nombre ?? "").trim(),
        sueldo_base_mensual: Number(values.sueldo_base_mensual) || 0,
      };

      await crearDoctor({ persona, doctor });
      reset(defaultValues);
      setAvatarPreview(null);
      onCreated?.();
    } catch (err) {
      setSubmitError(err?.message || "No se pudo crear el doctor. Intenta nuevamente.");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setValue("avatarFile", file, { shouldDirty: true, shouldValidate: false });
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
                    <TextField
                      {...field}
                      label="Nombre"
                      required
                      error={!!errors.nombre}
                      helperText={errors.nombre?.message}
                    />
                  )}
                />
                <Controller
                  name="apellido_paterno"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Apellido paterno"
                      required
                      error={!!errors.apellido_paterno}
                      helperText={errors.apellido_paterno?.message}
                    />
                  )}
                />
                <Controller
                  name="apellido_materno"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Apellido materno (opcional)"
                      error={!!errors.apellido_materno}
                      helperText={errors.apellido_materno?.message}
                    />
                  )}
                />
                <Controller
                  name="rut"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="RUT"
                      required
                      error={!!errors.rut}
                      helperText={errors.rut?.message}
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      required
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
                <Controller
                  name="telefono_principal"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Teléfono principal"
                      error={!!errors.telefono_principal}
                      helperText={errors.telefono_principal?.message}
                    />
                  )}
                />
                <Controller
                  name="telefono_secundario"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Teléfono secundario (opcional)"
                      error={!!errors.telefono_secundario}
                      helperText={errors.telefono_secundario?.message}
                    />
                  )}
                />
                <Controller
                  name="direccion"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Dirección"
                      error={!!errors.direccion}
                      helperText={errors.direccion?.message}
                    />
                  )}
                />
              </Stack>
            </Grid>
            <Grid item xs={1} sm={6}>
              <Stack spacing={2}>
                <Controller
                  name="bio"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Biografía"
                      multiline
                      minRows={3}
                      error={!!errors.bio}
                      helperText={errors.bio?.message}
                    />
                  )}
                />
                <Controller
                  name="especialidadesIds"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.especialidadesIds} disabled={loadingEspecialidades}>
                      <InputLabel id="especialidades-label" required>
                        Especialidades
                      </InputLabel>
                      <Select
                        {...field}
                        labelId="especialidades-label"
                        multiple
                        label="Especialidades"
                        value={field.value || []}
                        renderValue={(selected) => {
                          if (!selected.length) {
                            return "Selecciona especialidades";
                          }
                          return (
                            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                              {selected.map((value) => {
                                const option = especialidadesOptions.find((opt) => opt.value === value);
                                return option ? <Chip key={value} label={option.label} size="small" /> : null;
                              })}
                            </Stack>
                          );
                        }}
                        onChange={(event) =>
                          field.onChange((event.target.value || []).map((value) => Number(value)))
                        }
                      >
                        {especialidadesOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>{errors.especialidadesIds?.message}</FormHelperText>
                    </FormControl>
                  )}
                />
                <Controller
                  name="sueldo_base_mensual"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Sueldo base mensual"
                      type="number"
                      inputProps={{ min: 0 }}
                      error={!!errors.sueldo_base_mensual}
                      helperText={errors.sueldo_base_mensual?.message}
                    />
                  )}
                />
                <Controller
                  name="pago_por_atencion"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Pago por atención"
                      type="number"
                      inputProps={{ min: 0 }}
                      error={!!errors.pago_por_atencion}
                      helperText={errors.pago_por_atencion?.message}
                    />
                  )}
                />
                <Controller
                  name="tope_variable_mensual"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tope variable mensual"
                      placeholder="Dejar vacío para sin tope"
                      type="number"
                      inputProps={{ min: 0 }}
                      error={!!errors.tope_variable_mensual}
                      helperText={errors.tope_variable_mensual?.message}
                    />
                  )}
                />
              </Stack>
            </Grid>
            <Grid item xs={1} sm={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{ width: 72, height: 72, borderRadius: "50%" }}
                  alt="Vista previa avatar"
                >
                  {watch("nombre")?.charAt(0)?.toUpperCase() || ""}
                </Avatar>
                <Stack spacing={1}>
                  <Button variant="outlined" component="label">
                    Seleccionar avatar
                    <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Opcional. Formatos PNG, JPG o WEBP.
                  </Typography>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Box>
        {loadingEspecialidades && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Cargando especialidades…
          </Typography>
        )}
        {!!submitError && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {submitError}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2.5 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          form="nuevo-doctor-form"
          type="submit"
          variant="contained"
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
