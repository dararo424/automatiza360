import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AppointmentStatus, OrderStatus, TicketStatus } from '@prisma/client';

class MenuDiaItemDto {
  @IsString()
  @MaxLength(100)
  nombre!: string;

  @IsInt()
  @Min(0)
  precio!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}

export class CargarMenuDiaDto {
  @IsString()
  tenantId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MenuDiaItemDto)
  items!: MenuDiaItemDto[];
}

export class CrearOActualizarProductoDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(150)
  nombre!: string;

  @IsInt()
  @Min(0)
  precio!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;
}

export class ActualizarStockDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(150)
  nombre!: string;

  @IsInt()
  @Min(0)
  stock!: number;
}

export class ActualizarPrecioDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(150)
  nombre!: string;

  @IsInt()
  @Min(0)
  precio!: number;
}

export class EliminarProductoDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(150)
  nombre!: string;
}

export class CambiarEstadoTicketDto {
  @IsString()
  tenantId!: string;

  @IsEnum(TicketStatus)
  estado!: TicketStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fotoUrl?: string;
}

export class CancelarCitasRangoDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(10)
  fecha!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  horaDesde?: string;

  @IsOptional()
  @IsString()
  profesionalId?: string;
}

class PacienteCancelacionDto {
  @IsString()
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @MaxLength(20)
  telefono!: string;

  @IsString()
  @MaxLength(100)
  servicio!: string;

  @IsString()
  hora!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  profesional?: string | null;
}

export class NotificarCancelacionDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(50)
  industry!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PacienteCancelacionDto)
  pacientes!: PacienteCancelacionDto[];
}

export class CambiarEstadoOrdenDto {
  @IsString()
  tenantId!: string;

  @IsEnum(OrderStatus)
  estado!: OrderStatus;
}

export class CrearCitaAdminDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(100)
  clientName!: string;

  @IsString()
  @MaxLength(20)
  clientPhone!: string;

  @IsString()
  @MaxLength(100)
  serviceName!: string;

  @IsString()
  @MaxLength(10)
  fecha!: string;

  @IsString()
  @MaxLength(5)
  hora!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  profesionalNombre?: string;
}

export class CambiarEstadoCitaDto {
  @IsString()
  tenantId!: string;

  @IsEnum(AppointmentStatus)
  estado!: AppointmentStatus;
}

export class ReagendarCitaDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(10)
  nuevaFecha!: string;

  @IsString()
  @MaxLength(5)
  nuevaHora!: string;
}

export class RegistrarGastoDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(200)
  descripcion!: string;

  @IsInt()
  @Min(0)
  monto!: number;

  @IsString()
  @MaxLength(50)
  categoria!: string;
}

export class CrearTicketAdminDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(100)
  clientName!: string;

  @IsString()
  @MaxLength(20)
  clientPhone!: string;

  @IsString()
  @MaxLength(100)
  device!: string;

  @IsString()
  @MaxLength(500)
  issue!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fotoUrl?: string;
}

export class CrearCampañaRapidaDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(1000)
  mensaje!: string;
}

export class CrearCuponAdminDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(30)
  codigo!: string;

  @IsString()
  @MaxLength(20)
  tipo!: string;

  @IsInt()
  @Min(1)
  valor!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minCompra?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsos?: number;

  @IsOptional()
  @IsString()
  fechaVencimiento?: string;
}

export class CrearContactoAdminDto {
  @IsString()
  tenantId!: string;

  @IsString()
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @MaxLength(20)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}
