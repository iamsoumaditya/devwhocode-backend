import { IsArray, IsUUID } from "class-validator";

export class DeleteTestcasesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
