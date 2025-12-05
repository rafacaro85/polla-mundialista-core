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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessCode = void 0;
const typeorm_1 = require("typeorm");
const league_entity_1 = require("./league.entity");
const access_code_status_enum_1 = require("../enums/access-code-status.enum");
const user_entity_1 = require("./user.entity");
let AccessCode = class AccessCode {
    id;
    code;
    league;
    status;
    usedBy;
    createdAt;
    usedAt;
};
exports.AccessCode = AccessCode;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AccessCode.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], AccessCode.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => league_entity_1.League, league => league.accessCodes, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'league_id' }),
    __metadata("design:type", league_entity_1.League)
], AccessCode.prototype, "league", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: access_code_status_enum_1.AccessCodeStatus,
        default: access_code_status_enum_1.AccessCodeStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], AccessCode.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.accessCodesUsed, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'used_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], AccessCode.prototype, "usedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], AccessCode.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'used_at', type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], AccessCode.prototype, "usedAt", void 0);
exports.AccessCode = AccessCode = __decorate([
    (0, typeorm_1.Entity)({ name: 'access_codes' })
], AccessCode);
//# sourceMappingURL=access-code.entity.js.map