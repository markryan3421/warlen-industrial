<?php

namespace App\Enums;

enum PayrollPeriodStatusEnum: string
{
    case OPEN = 'open';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';

    public function label(): string
    {
        return match($this) {
            self::OPEN => 'Open',
            self::PROCESSING => 'Processing',
            self::COMPLETED => 'Calculated',
        };
    }

    public static function options(): array
    {
        return array_map(
            fn($case) => [
                'value' => $case->value,
                'label' => $case->label() 
            ],
            self::cases()
        );
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}