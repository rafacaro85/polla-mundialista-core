import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import { Transaction } from '../../database/entities/transaction.entity';
import { User } from '../../database/entities/user.entity';
import { League } from '../../database/entities/league.entity';

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    async generateVoucher(transaction: Transaction, user: User, league: League): Promise<Buffer> {
        try {
            const templateHtml = this.getVoucherTemplate();
            const template = handlebars.compile(templateHtml);

            const data = {
                transactionId: transaction.referenceCode,
                date: transaction.createdAt.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                userName: user.fullName || user.nickname,
                userEmail: user.email,
                leagueName: league.name,
                packageName: this.getPackageName(league.packageType), // Helper method needed or pass string
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
        } catch (error) {
            this.logger.error('Error generating PDF voucher', error);
            throw error;
        }
    }

    private getPackageName(packageType: string): string {
        const packages: Record<string, string> = {
            'starter': 'Plan Bronce',
            'amateur': 'Plan Plata',
            'semi-pro': 'Plan Oro',
            'pro': 'Plan Platino',
            'elite': 'Plan Diamante',
            'legend': 'Plan Esmeralda',
        };
        return packages[packageType] || packageType || 'Plan Personalizado';
    }

    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
    }

    private getVoucherTemplate(): string {
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
}
