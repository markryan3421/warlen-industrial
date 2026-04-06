<?php

namespace App\Concerns;

use Illuminate\Support\Facades\DB;

trait ManageSession
{
    protected function invalidateUserSessions(int $userId): void
    {
        DB::table('sessions')->where('user_id', $userId)->delete();
    }
}
