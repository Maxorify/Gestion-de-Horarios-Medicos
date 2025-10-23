-- RPCs para confirmar citas y listar confirmadas de un doctor
CREATE OR REPLACE FUNCTION public.confirmar_cita_simple(
  _cita_id bigint,
  _usuario_id_legacy bigint,
  _monto integer DEFAULT 0,
  _metodo text DEFAULT NULL,
  _obs text DEFAULT NULL
)
RETURNS TABLE(
  id bigint,
  paciente_id bigint,
  doctor_id bigint,
  disponibilidad_id bigint,
  estado text,
  fecha_hora_inicio_agendada timestamptz,
  fecha_hora_fin_agendada timestamptz,
  monto_pagado integer,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_estado text;
BEGIN
  SELECT estado INTO v_estado
  FROM public.citas
  WHERE id = _cita_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cita no encontrada o eliminada';
  END IF;

  -- Para demo: permitir confirmar desde programada o pendiente
  IF v_estado NOT IN ('programada','pendiente','confirmada') THEN
    RAISE EXCEPTION 'Solo se puede confirmar desde programada/pendiente (o ya confirmada)';
  END IF;

  UPDATE public.citas
  SET
    estado = 'confirmada',
    monto_pagado = COALESCE(monto_pagado,0) + GREATEST(_monto,0),
    updated_at = timezone('utc', now())
  WHERE id = _cita_id;

  INSERT INTO public.event_log(evento, detalle)
  VALUES (
    'CITA_CONFIRMADA_DEMO',
    jsonb_build_object(
      'cita_id', _cita_id,
      'confirmada_por_usuario_id_legacy', _usuario_id_legacy,
      'monto', _monto,
      'metodo', _metodo,
      'obs', _obs,
      'timestamp', now()
    )
  );

  RETURN QUERY
  SELECT id,paciente_id,doctor_id,disponibilidad_id,estado,
         fecha_hora_inicio_agendada,fecha_hora_fin_agendada,
         monto_pagado,created_at,updated_at,deleted_at
  FROM public.citas
  WHERE id = _cita_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_citas_doctor_confirmadas(
  _doctor_id bigint,
  _desde timestamptz DEFAULT (now() - interval '1 day'),
  _hasta timestamptz DEFAULT (now() + interval '7 days')
)
RETURNS TABLE(
  cita_id bigint,
  fecha_hora_inicio_agendada timestamptz,
  fecha_hora_fin_agendada timestamptz,
  paciente_id bigint,
  paciente_nombre text,
  paciente_rut text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.fecha_hora_inicio_agendada,
    c.fecha_hora_fin_agendada,
    c.paciente_id,
    trim(coalesce(per.nombre,'') || ' ' || coalesce(per.apellido_paterno,'') || ' ' || coalesce(per.apellido_materno,'')) AS paciente_nombre,
    per.rut
  FROM public.citas c
  JOIN public.pacientes p ON p.id = c.paciente_id AND p.deleted_at IS NULL
  JOIN public.personas per ON per.id = p.persona_id
  WHERE c.deleted_at IS NULL
    AND c.doctor_id = _doctor_id
    AND c.estado = 'confirmada'
    AND c.fecha_hora_inicio_agendada >= _desde
    AND c.fecha_hora_inicio_agendada < _hasta
  ORDER BY c.fecha_hora_inicio_agendada ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirmar_cita_simple(bigint,bigint,integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_citas_doctor_confirmadas(bigint,timestamptz,timestamptz) TO authenticated;
