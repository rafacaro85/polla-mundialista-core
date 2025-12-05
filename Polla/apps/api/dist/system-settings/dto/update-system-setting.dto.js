"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSystemSettingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_system_setting_dto_1 = require("./create-system-setting.dto");
class UpdateSystemSettingDto extends (0, mapped_types_1.PartialType)(create_system_setting_dto_1.CreateSystemSettingDto) {
}
exports.UpdateSystemSettingDto = UpdateSystemSettingDto;
//# sourceMappingURL=update-system-setting.dto.js.map