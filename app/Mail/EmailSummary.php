<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailSummary extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $totals, public array $filters)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payroll Summary Report',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payroll-summary',
        );
    }
}