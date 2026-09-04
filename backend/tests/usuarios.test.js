import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { tokens } from './helpers/auth.js';

describe('Módulo de Administración de Usuarios / Trabajadores (GET, POST, PATCH, PUT /api/usuarios)', () => {
  const adminToken = tokens.admin;
  const vetToken   = tokens.veterinario;
  const recToken   = tokens.recepcionista;

  describe('Control de Acceso por Rol (RBAC)', () => {
    it('403 Forbidden si un veterinario intenta listar usuarios', async () => {
      const res = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${vetToken}`);
      expect(res.status).toBe(403);
    });

    it('403 Forbidden si una recepcionista intenta crear un usuario', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${recToken}`)
        .send({ cedula: '999888777', nombre: 'Test Work', password: 'password123', rol_id: 2 });
      expect(res.status).toBe(403);
    });
  });

  describe('Operaciones Admin (Permitido)', () => {
    let newUserId;
    const testCedula = `test_${Date.now()}`;

    it('GET /api/usuarios → 200 + lista de trabajadores activos/inactivos para admin', async () => {
      const res = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('POST /api/usuarios → 201 + registra nuevo trabajador', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cedula: testCedula,
          nombre: 'Dr. Test Nuevo Vet',
          password: 'password123',
          rol_id: 2 // Veterinario
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe('Dr. Test Nuevo Vet');
      newUserId = res.body.id;
    });

    it('POST /api/usuarios → 409 Conflict si la cédula ya existe', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cedula: testCedula,
          nombre: 'Duplicado Vet',
          password: 'password123',
          rol_id: 2
        });

      expect(res.status).toBe(409);
    });

    it('PATCH /api/usuarios/:id/estado → 200 + conmuta estado a inactivo', async () => {
      const res = await request(app)
        .patch(`/api/usuarios/${newUserId}/estado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activo: false });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('inactivo');
    });

    it('PUT /api/usuarios/:id/password → 200 + cambia contraseña de trabajador', async () => {
      const res = await request(app)
        .put(`/api/usuarios/${newUserId}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'newPassword123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('exitosa');
    });
  });
});
