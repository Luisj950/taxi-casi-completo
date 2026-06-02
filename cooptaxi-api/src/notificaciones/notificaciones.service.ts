// notificaciones.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificacionesService implements OnModuleInit {
  private readonly logger = new Logger(NotificacionesService.name);
  private firebaseReady = false;

  constructor(private readonly cfg: ConfigService) {}

  onModuleInit() {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId:   this.cfg.get('FIREBASE_PROJECT_ID'),
            privateKey:  this.cfg.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
            clientEmail: this.cfg.get('FIREBASE_CLIENT_EMAIL'),
          }),
        });
      }
      this.firebaseReady = true;
      this.logger.log('Firebase Admin inicializado');
    } catch (e) {
      this.logger.warn('Firebase no configurado — push notifications desactivadas');
    }
  }

  async sendPush(token: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.firebaseReady) {
      this.logger.debug(`[DEV] Push omitida: ${title} → ${body}`);
      return;
    }
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
    } catch (e) {
      this.logger.error('Error enviando push:', e);
    }
  }

  async sendMulticast(tokens: string[], title: string, body: string) {
    if (!this.firebaseReady || !tokens.length) return;
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
    });
  }
}
