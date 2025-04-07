import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AfterViewChecked, Component, ElementRef, OnInit, SecurityContext, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'; // 🔹 Importa DomSanitizer
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, PieController, ArcElement, Legend, Tooltip, ChartType, ChartConfiguration, TooltipItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';


Chart.register(ChartDataLabels);

interface Message {
  sender: string;
  text: SafeHtml; // Cambiamos el tipo a SafeHtml para HTML seguro
  timestamp: Date;
}
interface PieChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
  }[];
}

@Component({
  selector: 'app-chat',
  imports: [BaseChartDirective,CommonModule,HttpClientModule,FormsModule,MatIconModule,MatProgressSpinnerModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit,AfterViewChecked  {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

// Tipo de gráfico
public pieChartType: ChartType = 'pie';
// Datos del gráfico de Atenciones (tonos azulados intensos)
public pieChartAtencionesData = {
  labels: ['Sin Respuesta', 'En Curso', 'Atendidas'],
  datasets: [{
    data: [20, 40, 80], 
    backgroundColor: ['#bfdbfe', '#93c5fd', '#60a5fa']
  }]
};

// Datos del gráfico de Citas (azules/celestes brillantes)
public pieChartCitasData = {
  labels: ['Citas Reservadas', 'Citas No Logradas'],
  datasets: [{
    data: [400, 200],
    backgroundColor: ['#60a5fa', '#bfdbfe'], // Celeste brillante, Turquesa
  }],
};

public pieChartPlugins = [ChartDataLabels];

// Opciones del gráfico con porcentajes
public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: {
          size: 12
        }
      }
    },
    datalabels: {
      formatter: (value, context) => {
        const data = context.chart.data.datasets[0].data as number[];
        const total = data.reduce((acc, val) => acc + val, 0);
        const percentage = ((value as number) / total * 100).toFixed(1);
        return `${percentage}%`;
      },
      color: '#fff',
      font: {
        weight: 'bold',
        size: 14
      }
    }
  }
};



  salir() {
    sessionStorage.removeItem('token');
    window.location.href = '/';
}
  isBotTyping: boolean = false; // Controla la animación de "escribiendo..."

  @ViewChild('chatContainer') private chatContainer!: ElementRef; // Referencia al contenedor del chat
  session_id: string = sessionStorage.getItem('token') || "";
  messages: Message[] = [];
  newMessage: string = '';
  apiUrl = 'https://uou2wn6au4.execute-api.us-east-1.amazonaws.com/Prod'; // Reemplaza con la URL de tu API

  constructor(private http: HttpClient, public sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.showWelcomeMessage(); // Mostrar mensaje de bienvenida al cargar el chat
  }
  linkifyHtmlContent(safeHtml: SafeHtml): SafeHtml {
    // 1. Convertir SafeHtml a string
    const htmlString = this.sanitizer.sanitize(SecurityContext.HTML, safeHtml) || '';
    
    // 2. Procesar el string y añadir estilos
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const linkedText = htmlString.replace(urlRegex, url => 
      `<a href="${url}" target="_blank" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${url}</a>`
    );
    
    // 3. Volver a marcar como seguro
    return this.sanitizer.bypassSecurityTrustHtml(linkedText);
}
  private showWelcomeMessage(): void {
    const welcomeMessage: Message = {
      sender: 'AGENTE ROE',
      text: this.sanitizer.bypassSecurityTrustHtml('Hola, ¿Quieres realizar una cita o presupuesto?'),
      timestamp: new Date()
    };
    this.messages.push(welcomeMessage); // Agregar el mensaje de bienvenida al array de mensajes
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom(); // Desplazarse al final cada vez que la vista se actualiza
  }
  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error al desplazar el chat:', err);
    }
  }

  loadMessages(question: string) {
    this.isBotTyping = true; // Activar animación

    const body = {
      body: `{\"session_id\": \"${this.session_id}\", \"question\": \"${question}\"}`
    };

    this.http.post<{ body: string }>(this.apiUrl, body).subscribe(
      (response) => {
        try {
          const parsedBody = JSON.parse(response.body);
          let formattedText = parsedBody.answer
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\n/g, '<br>');

          const botMessage: Message = {
            sender: 'Bot',
            text: this.sanitizer.bypassSecurityTrustHtml(formattedText),
            timestamp: new Date()
          };

          this.messages.push(botMessage);
        } catch (error) {
          console.error('Error procesando la respuesta del bot:', error);
        } finally {
          this.isBotTyping = false; // Desactivar animación
        }
      },
      (error) => {
        console.error('Error obteniendo respuesta del bot', error);
        this.isBotTyping = false; // Desactivar animación en caso de error
      }
    );
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const userMessage: Message = {
      sender: 'Usuario',
      text: this.sanitizer.bypassSecurityTrustHtml(this.newMessage), // 🔹 Sanitizar mensaje del usuario
      timestamp: new Date()
    };

    this.messages.push(userMessage); // Muestra el mensaje del usuario inmediatamente en la UI

    this.loadMessages(this.newMessage); // Envía el mensaje a la API y espera respuesta

    this.newMessage = ''; // Limpia el input
  }
}