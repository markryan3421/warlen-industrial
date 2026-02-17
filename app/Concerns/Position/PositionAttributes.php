<?php

namespace App\Concerns\Position;

trait PositionAttributes
{
    protected function positionAttributes(): array
    {
        return [
            'pos_name' => 'position name',
            'salary_rate' => 'salary rate',
            'reg_overtime_rate' => 'regular overtime rate',
            'special_overtime_rate' => 'special overtime rate',
            'sss_rate' => 'SSS rate',
            'philhealth_rate' => 'PhilHealth rate',
            'pagibig_rate' => 'Pag-IBIG rate',
        ];
    }
}
