import { IsArray, IsUUID } from "class-validator";

export class DeleteStudentDto {
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds: string[];
}
