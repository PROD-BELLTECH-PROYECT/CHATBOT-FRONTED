import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AfterViewChecked, Component, ElementRef, OnInit, SecurityContext, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, PieController, ArcElement, Legend, Tooltip, ChartType, ChartConfiguration, TooltipItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { WebSocketService } from '../../service/webSocket.service';
import { Subscription } from 'rxjs';



Chart.register(ChartDataLabels);
interface ValidateResponse {
statusCode: number;
body: {
  status: string;
  messageId: string;
  group: string;
};
}

interface Message {
  sender: string;
  text: string;
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
  imports: [BaseChartDirective, CommonModule, HttpClientModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
    private wsSub!: Subscription;
  allResponses: string[] = []; // lo defines en la clase

  // Configuración de gráficos
  public pieChartType: ChartType = 'pie';
  public pieChartAtencionesData = {
    labels: ['Sin Respuesta', 'En Curso', 'Atendidas'],
    datasets: [{
      data: [20, 40, 80],
      backgroundColor: ['#8ff30f', '#f9770b', '#00b0cc']
    }]
  };

  public pieChartCitasData = {
    labels: ['Citas Reservadas', 'Citas No Logradas'],
    datasets: [{
      data: [400, 200],
      backgroundColor: ['#00b0cc', '#f9770b'],
    }],
  };

  public pieChartPlugins = [ChartDataLabels];
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
        color: 'black',
        font: {
          weight: 'bold',
          size: 14
        }
      }
    }
  };

  // Variables de estado
  isBotTyping: boolean = false;
  session_id: string = sessionStorage.getItem('token') || "";
  messages: Message[] = [];
  newMessage: string = '';
  apiUrl = 'https://x51rim8ude.execute-api.us-east-1.amazonaws.com/prod';
  // Configuración de reintentos
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;
  private currentQuestion = '';
  private currentResponse = '';
  private retryCount = 0;

  constructor(private http: HttpClient, public sanitizer: DomSanitizer,  private wsService: WebSocketService  ) {}

  ngOnInit(): void {
    this.showWelcomeMessage();
    
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  salir() {
    sessionStorage.removeItem('token');
    window.location.href = '/';
  }

  linkifyHtmlContent(safeHtml: SafeHtml): SafeHtml {
    const htmlString = this.sanitizer.sanitize(SecurityContext.HTML, safeHtml) || '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const linkedText = htmlString.replace(urlRegex, url => 
      `<a href="${url}" target="_blank" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${url}</a>`
    );
    return this.sanitizer.bypassSecurityTrustHtml(linkedText);
  }

  private showWelcomeMessage(): void {
    const welcomeMessage: Message = {
      sender: 'AGENTE ROE',
      text: 'Hola, ¿En qué te puedo ayudar?',
      timestamp: new Date()
    };
    this.messages.push(welcomeMessage);
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error al desplazar el chat:', err);
    }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const userMessage: Message = {
      sender: 'Usuario',
      text:this.newMessage,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.wsService.sendMessage({
      question: this.newMessage,
      session_id: this.session_id,
      interaction: this.messages.length.toString()
    });
    this.loadMessages(this.newMessage);
    this.newMessage = '';
  }

  loadMessages(question: string) {
    this.isBotTyping = true;
    this.currentQuestion = question;
    this.retryCount = 0;
    this.wsSub = this.wsService.getMessages().subscribe((response) => {
  if (
    response &&
    response.session_id === this.session_id &&
    response.interaction === this.messages.length.toString()
  ) {
    // Captura el mensaje más reciente en una variable
    this.currentResponse = response.answer;
    console.log('Respuesta del servidor:',response);
    const botMessage: Message = {
      sender: 'AGENTE ROE',
      text: this.currentResponse,
      timestamp: new Date()
    };
    this.messages.push(botMessage);
    this.isBotTyping = false;
    this.scrollToBottom();
  }
});

  }


}