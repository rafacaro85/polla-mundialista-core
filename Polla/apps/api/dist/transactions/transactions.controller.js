"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const transactions_service_1 = require("./transactions.service");
const pdf_service_1 = require("../common/pdf/pdf.service");
let TransactionsController = class TransactionsController {
    transactionsService;
    pdfService;
    constructor(transactionsService, pdfService) {
        this.transactionsService = transactionsService;
        this.pdfService = pdfService;
    }
    async getAllTransactions() {
        return this.transactionsService.findAll();
    }
    async downloadVoucher(id, res) {
        const transaction = await this.transactionsService.findOne(id);
        if (!transaction) {
            throw new common_1.NotFoundException('Transacción no encontrada');
        }
        if (!transaction.user || !transaction.league) {
            throw new common_1.NotFoundException('Datos incompletos de la transacción (usuario o liga faltante)');
        }
        const buffer = await this.pdfService.generateVoucher(transaction, transaction.user, transaction.league);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=voucher-${transaction.referenceCode}.pdf`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getAllTransactions", null);
__decorate([
    (0, common_1.Get)(':id/voucher'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "downloadVoucher", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService,
        pdf_service_1.PdfService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map