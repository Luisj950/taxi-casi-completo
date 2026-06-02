// seguridad.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/seguridad', cors: { origin: '*' } })
export class SeguridadGateway {
  @WebSocketServer() server: Server;
  private readonly choferSockets = new Map<string, { sid: string; lat: number; lng: number }>();

  @SubscribeMessage('register_chofer')
  register(@ConnectedSocket() c: Socket, @MessageBody() d: { chofer_id: string; lat: number; lng: number }) {
    this.choferSockets.set(d.chofer_id, { sid: c.id, lat: d.lat, lng: d.lng });
    c.join('choferes_seguridad');
  }

  @SubscribeMessage('join_central_seguridad')
  joinCentral(@ConnectedSocket() c: Socket) { c.join('central_seguridad'); }

  emitirPanico(payload: { chofer_id: string; lat: number; lng: number; incidente_id: string }): number {
    this.server.to('central_seguridad').emit('panic_alert', payload);
    // Notificar choferes en radio ~2km
    const RADIO = 0.02; // grados ≈ 2km
    let count = 0;
    for (const [id, info] of this.choferSockets.entries()) {
      if (id !== payload.chofer_id) {
        const dist = Math.abs(info.lat - payload.lat) + Math.abs(info.lng - payload.lng);
        if (dist <= RADIO) {
          this.server.to(info.sid).emit('panic_alert', payload);
          count++;
        }
      }
    }
    return count;
  }
}
