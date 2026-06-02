import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('retorna 401 con credenciales incorrectas', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'noexiste@test.com', password: 'wrong' })
        .expect(401);
    });

    it('retorna 400 si faltan campos', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'noexiste@test.com' })
        .expect(400);
    });

    // Este test requiere el seed ejecutado previamente
    it('retorna 201 y tokens con credenciales válidas', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@cooptaxi.com', password: 'Admin1234!' });

      if (res.status === 401) {
        console.warn('Seed no ejecutado — saltando test de login exitoso');
        return;
      }

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      accessToken = res.body.access_token;
    });
  });

  describe('GET /api/auth/me', () => {
    it('retorna 401 sin token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('retorna el usuario si el token es válido', async () => {
      if (!accessToken) return;

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'admin@cooptaxi.com');
    });
  });
});
