-- ============================================================================
-- CUSSHMI — Permitir que el rol "programador" (no solo "admin") pueda
-- eliminar una programación de su propia comisión.
--
-- Hasta ahora "Eliminar programación" (Consolidado de Demandas) era
-- admin-only en dos capas: la política RLS de la tabla padre
-- (prog_sem_delete, 003_modelo_datos.sql) y la del historial que cuelga de
-- ella (historial_delete, 007_eliminar_programacion.sql) — el resto de
-- tablas hijas (turnos_riego, usuarios_g3_seleccionados) ya permitían
-- borrar a "programador" de su propia comisión (política turnos_write /
-- usuariosg3_write, "for all"), así que solo hacía falta destrabar estas
-- dos. Diego/Saúl (programadores) pidieron poder corregir ellos mismos una
-- toma que agregaron por error o que ya no necesitan, sin depender de que
-- el admin lo haga por ellos.
-- ============================================================================

drop policy if exists prog_sem_delete on programaciones_semanales;
create policy prog_sem_delete on programaciones_semanales for delete
    using (public.rol_actual() = 'admin' or
        (public.rol_actual() = 'programador' and comision_id = public.comision_actual()));

drop policy if exists historial_delete on historial_programaciones;
create policy historial_delete on historial_programaciones for delete
    using (
        exists (select 1 from programaciones_semanales p where p.id = programacion_id
            and (public.rol_actual() = 'admin' or
                (public.rol_actual() = 'programador' and p.comision_id = public.comision_actual())))
    );
