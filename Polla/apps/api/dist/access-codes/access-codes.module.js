"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessCodesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const access_codes_service_1 = require("./access-codes.service");
const access_code_entity_1 = require("../database/entities/access-code.entity");
const league_entity_1 = require("../database/entities/league.entity");
const user_entity_1 = require("../database/entities/user.entity");
let AccessCodesModule = class AccessCodesModule {
};
exports.AccessCodesModule = AccessCodesModule;
exports.AccessCodesModule = AccessCodesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([access_code_entity_1.AccessCode, league_entity_1.League, user_entity_1.User])],
        providers: [access_codes_service_1.AccessCodesService],
        exports: [access_codes_service_1.AccessCodesService],
    })
], AccessCodesModule);
//# sourceMappingURL=access-codes.module.js.map