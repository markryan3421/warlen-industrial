<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Support\Facades\DB;

trait ManageSession
{
    protected function invalidateUserSessions(int $userId): void
    {
        $user = User::findOrFail($userId);

        DB::table('sessions')->where('user_id', $user->id)->delete();

        $user->remember_token = null;
        $user->save();
    }
}
