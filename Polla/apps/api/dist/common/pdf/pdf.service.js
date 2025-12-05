"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const puppeteer = __importStar(require("puppeteer"));
const handlebars = __importStar(require("handlebars"));
let PdfService = PdfService_1 = class PdfService {
    logger = new common_1.Logger(PdfService_1.name);
    async generateVoucher(transaction, user, league) {
        try {
            const templateHtml = this.getVoucherTemplate();
            const template = handlebars.compile(templateHtml);
            const data = {
                transactionId: transaction.referenceCode,
                date: transaction.createdAt.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                userName: user.fullName || user.nickname,
                userEmail: user.email,
                leagueName: league.name,
                packageName: this.getPackageName(league.packageType),
                amount: this.formatCurrency(transaction.amount),
                status: transaction.status,
                year: new Date().getFullYear(),
            };
            const html = template(data);
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                },
            });
            await browser.close();
            return Buffer.from(pdfBuffer);
        }
        catch (error) {
            this.logger.error('Error generating PDF voucher', error);
            throw error;
        }
    }
    getPackageName(packageType) {
        const packages = {
            'starter': 'Plan Bronce',
            'amateur': 'Plan Plata',
            'semi-pro': 'Plan Oro',
            'pro': 'Plan Platino',
            'elite': 'Plan Diamante',
            'legend': 'Plan Esmeralda',
        };
        return packages[packageType] || packageType || 'Plan Personalizado';
    }
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
    }
    getVoucherTemplate() {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 18px;
            font-weight: normal;
            color: #666;
            text-transform: uppercase;
          }
          .info-section {
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
          }
          .info-block {
            width: 48%;
          }
          .label {
            font-weight: bold;
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .value {
            font-size: 14px;
            margin-bottom: 12px;
          }
          .table-container {
            margin-bottom: 40px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            text-align: left;
            border-bottom: 1px solid #ddd;
            padding: 10px;
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
          }
          td {
            padding: 15px 10px;
            border-bottom: 1px solid #eee;
          }
          .total-row td {
            border-top: 2px solid #333;
            border-bottom: none;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #eee;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">POLLA MUNDIALISTA</div>
          <div class="title">Comprobante de Pago</div>
        </div>

        <div class="info-section">
          <div class="info-block">
            <div class="label">Cliente</div>
            <div class="value">{{userName}}<br>{{userEmail}}</div>
            
            <div class="label">Fecha</div>
            <div class="value">{{date}}</div>
          </div>
          <div class="info-block" style="text-align: right;">
            <div class="label">Referencia</div>
            <div class="value">#{{transactionId}}</div>
            
            <div class="label">Estado</div>
            <div class="value">
              <span class="status-badge">{{status}}</span>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th style="text-align: center;">Cant.</th>
                <th style="text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{{packageName}}</strong><br>
                  <span style="font-size: 12px; color: #666;">Liga: {{leagueName}}</span>
                </td>
                <td style="text-align: center;">1</td>
                <td style="text-align: right;">{{amount}}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">TOTAL</td>
                <td style="text-align: right;">{{amount}}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Gracias por tu compra. Este documento es un soporte de servicio digital generado automáticamente.</p>
          <p>&copy; {{year}} Polla Mundialista. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfService);
//# sourceMappingURL=pdf.service.js.map