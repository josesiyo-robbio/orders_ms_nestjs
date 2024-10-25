import { IsString, IsUUID } from "class-validator";



export class PaidOrderDto
{
    @IsString()
    stripePaymentId:string;

    @IsString()
    @IsUUID()
    orderId:string;

    @IsString()
    @IsUUID()
    receiptUrl:string;
}