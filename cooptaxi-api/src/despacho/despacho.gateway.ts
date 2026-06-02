import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/despacho', cors: { origin: '*' } })
export class DespachoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DespachoGateway.name);

  // Mapa chofer_id → socket.id para mensajes dirigidos
  private readonly choferSockets = new Map<string, string>();
  // Mapa pasajero_id → socket.id
  private readonly pasajeroSockets = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Limpiar mapas al desconectar
    for (const [uid, sid] of this.choferSockets.entries()) {
      if (sid === client.id) this.choferSockets.delete(uid);
    }
    for (const [uid, sid] of this.pasajeroSockets.entries()) {
      if (sid === client.id) this.pasajeroSockets.delete(uid);
    }
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // Chofer se une a la cola
  @SubscribeMessage('join_queue')
  handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chofer_id: string },
  ) {
    this.choferSockets.set(data.chofer_id, client.id);
    client.join('choferes');
    this.logger.log(`Chofer ${data.chofer_id} en cola`);
  }

  // Pasajero se registra
  @SubscribeMessage('join_pasajero')
  handleJoinPasajero(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pasajero_id: string },
  ) {
    this.pasajeroSockets.set(data.pasajero_id, client.id);
  }

  // Despachador se une a sala de control
  @SubscribeMessage('join_central')
  handleJoinCentral(@ConnectedSocket() client: Socket) {
    client.join('central');
  }

  // GPS update del chofer (cada ~5 seg durante carrera)
  @SubscribeMessage('gps_update')
  handleGpsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chofer_id: string; lat: number; lng: number; carrera_id: string },
  ) {
    // Reenviar a la sala central para que el despachador vea el mapa
    this.server.to('central').emit('gps_chofer', data);
  }

  // ─── Métodos de emisión (llamados desde servicios) ────

  notificarChofer(chofer_id: string, evento: string, payload: object) {
    const sid = this.choferSockets.get(chofer_id);
    if (sid) {
      this.server.to(sid).emit(evento, payload);
    } else {
      this.logger.warn(`Chofer ${chofer_id} no conectado vía WS`);
    }
  }

  notificarPasajero(pasajero_id: string, evento: string, payload: object) {
    const sid = this.pasajeroSockets.get(pasajero_id);
    if (sid) this.server.to(sid).emit(evento, payload);
  }

  broadcastCola() {
    // Avisa a todos los despachadores que recarguen la cola
    this.server.to('central').emit('cola_actualizada');
  }
}
