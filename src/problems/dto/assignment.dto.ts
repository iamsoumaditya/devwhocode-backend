import { Expose, Type } from 'class-transformer';
import { IsInt, IsString, IsUUID } from 'class-validator';

export class AssignmentDto {
  @IsString()
  name: string;
}

export class AssignmentResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

export class AssignmentFromLabResponseDto {
  @Expose()
  assignment: {
    id: string;
    name: string;
  };
  @Expose()
  isActive: boolean;
}

export class AssignmentToLabDto {
  @IsInt()
  @Type(() => Number)
  assignmentId: number;
}

export class AssignmentToLabResponseDto {
  @Expose() labId: number;
  @Expose() labName: string;
  @Expose() assignmentId: number;
  @Expose() assignmentName: string;
  @Expose() isActive: boolean;
}

export class ActivateAssignmentDto {
  @IsInt()
  @Type(() => Number)
  labId: number;
}

export class ActivateAssignmentResponseDto {
  @Expose()
  labId: number;
  @Expose()
  assignmentId: number;
  @Expose()
  isActive: boolean;
}
