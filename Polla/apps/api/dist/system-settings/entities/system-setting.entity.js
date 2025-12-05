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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettings = void 0;
const typeorm_1 = require("typeorm");
let SystemSettings = class SystemSettings {
    id;
    instagram;
    facebook;
    whatsapp;
    tiktok;
    support;
    termsUrl;
    privacyUrl;
    copyright;
};
exports.SystemSettings = SystemSettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SystemSettings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'https://instagram.com/tupolla' }),
    __metadata("design:type", String)
], SystemSettings.prototype, "instagram", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'https://facebook.com/tupolla' }),
    __metadata("design:type", String)
], SystemSettings.prototype, "facebook", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'https://wa.me/123456' }),
    __metadata("design:type", String)
], SystemSettings.prototype, "whatsapp", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'https://tiktok.com/@tupolla' }),
    __metadata("design:type", String)
], SystemSettings.prototype, "tiktok", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'mailto:soporte@tupolla.com' }),
    __metadata("design:type", String)
], SystemSettings.prototype, "support", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '/terms' }),
    __metadata("design:type", String)
], SystemSettings.prototype, "termsUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '/privacy' }),
    __metadata("design:type", String)
], SystemSettings.prototype, "privacyUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'Copyright © 2026 TuApp. Todos los derechos reservados.' }),
    __metadata("design:type", String)
], SystemSettings.prototype, "copyright", void 0);
exports.SystemSettings = SystemSettings = __decorate([
    (0, typeorm_1.Entity)()
], SystemSettings);
//# sourceMappingURL=system-setting.entity.js.map