<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('payroll', function ($user) {
    return $user->hasAnyRole(['admin', 'hr_head']);
});

Broadcast::channel('payroll-period', function ($user) {
    return $user->hasAnyRole(['admin', 'hr_head']);
});
Broadcast::channel('application-leave', function ($user) {
    return $user->hasAnyRole(['admin', 'employee']);
});
