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
exports.League = void 0;
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
const league_type_enum_1 = require("../enums/league-type.enum");
const league_status_enum_1 = require("../enums/league-status.enum");
const league_participant_entity_1 = require("./league-participant.entity");
const access_code_entity_1 = require("./access-code.entity");
let League = class League {
    id;
    name;
    organization;
    type;
    accessCodePrefix;
    creator;
    maxParticipants;
    status;
    isPaid;
    packageType;
    brandingLogoUrl;
    prizeDetails;
    prizeImageUrl;
    welcomeMessage;
    participants;
    accessCodes;
};
exports.League = League;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], League.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], League.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'organization_id' }),
    __metadata("design:type", organization_entity_1.Organization)
], League.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: league_type_enum_1.LeagueType,
    }),
    __metadata("design:type", String)
], League.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'access_code_prefix', nullable: true }),
    __metadata("design:type", String)
], League.prototype, "accessCodePrefix", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'creator_id' }),
    __metadata("design:type", user_entity_1.User)
], League.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 3 }),
    __metadata("design:type", Number)
], League.prototype, "maxParticipants", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: league_status_enum_1.LeagueStatus,
        default: league_status_enum_1.LeagueStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], League.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_paid', default: false }),
    __metadata("design:type", Boolean)
], League.prototype, "isPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'package_type', default: 'starter' }),
    __metadata("design:type", String)
], League.prototype, "packageType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'branding_logo_url', nullable: true }),
    __metadata("design:type", String)
], League.prototype, "brandingLogoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'prize_details', type: 'text', nullable: true }),
    __metadata("design:type", String)
], League.prototype, "prizeDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'prize_image_url', nullable: true }),
    __metadata("design:type", String)
], League.prototype, "prizeImageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'welcome_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], League.prototype, "welcomeMessage", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => league_participant_entity_1.LeagueParticipant, participant => participant.league),
    __metadata("design:type", Array)
], League.prototype, "participants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => access_code_entity_1.AccessCode, accessCode => accessCode.league),
    __metadata("design:type", Array)
], League.prototype, "accessCodes", void 0);
exports.League = League = __decorate([
    (0, typeorm_1.Entity)({ name: 'leagues' })
], League);
//# sourceMappingURL=league.entity.js.map