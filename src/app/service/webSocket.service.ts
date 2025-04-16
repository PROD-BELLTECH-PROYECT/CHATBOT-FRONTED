import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { Interaction } from 'chart.js';
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$: WebSocketSubject<any>;

  constructor() {
    // Cambia esta URL al host de tu servidor WebSocket
    this.socket$ = webSocket({
      url: 'wss://1i1gjrq7h2.execute-api.us-east-1.amazonaws.com/production/',
      deserializer: msg => {
        try {
          if (!msg.data || msg.data.trim() === '') return null;
          return JSON.parse(msg.data);
        } catch (e) {
          console.warn('Mensaje no JSON válido recibido:', msg.data);
          return null;
        }
      }
    });
  }

  // Enviar mensaje al servidor
  sendMessage(message: any): void {
    this.socket$.next(message);
  }

  getMessages(): Observable<{session_id: string, interaction: string, answer: string} | null> {
    return this.socket$.asObservable();
  }

  // Cerrar la conexión WebSocket
  close(): void {
    this.socket$.complete();
  }

}
