{{--
    DEKA Sales – Password Reset Email
    Brand colors:
    - Accent: #CC570D (orange)
    - Primary: #093B92 (steel blue)
    - Card background: #fefaf5 (dirty white)
    - Body background: #f1ede8 (warm beige)
    - Text dark: #2c2b28
    - Text muted: #6b6258
--}}
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <title>DEKA Payroll – Password Reset</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
        /* Responsive rules – only for media queries, everything else inline */
        @media only screen and (max-width: 600px) {
            .inner-body { width: 100% !important; }
            .footer { width: 100% !important; }
            .content-cell { padding: 24px !important; }
            .button-table { width: 100% !important; }
            .button-td, .button-a { display: block !important; width: 100% !important; text-align: center !important; }
        }
        @media only screen and (max-width: 480px) {
            .content-cell { padding: 20px !important; }
            h1 { font-size: 22px !important; letter-spacing: 0.15em !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1ede8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

    <!-- Main wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#f1ede8" style="background-color: #f1ede8; width: 100%;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Centered container (max-width: 600px) -->
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 600px; width: 100%; margin: 0 auto;">
                    <tr>
                        <td>
                            <!-- Logo + gradient line -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 20px 0;">
                                        <a href="{{ url('/') }}" target="_blank" style="display: inline-block; text-decoration: none;">
                                            <img src="{{ url('/images/dekalogo.png') }}" alt="DEKA Sales" width="56" height="56" style="display: block; width: 56px; height: auto; opacity: 0.95; border: 0;">
                                        </a>
                                        <div style="width: 52px; height: 3px; background: linear-gradient(90deg, #CC570D, #093B92); margin: 16px auto 0 auto; border-radius: 4px;"></div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Main card -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fefaf5" style="background-color: #fefaf5; border-radius: 28px; border: 1px solid #e2dbd1; box-shadow: 0 20px 35px -10px rgba(0,0,0,0.08);">
                                <tr>
                                    <td class="content-cell" style="padding: 40px 36px;">

                                        <!-- Greeting -->
                                        @if (! empty($greeting))
                                            <h1 style="margin: 0 0 8px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 800; font-size: 26px; letter-spacing: 0.2em; color: #2c2b28; text-align: center;">{{ $greeting }}</h1>
                                        @else
                                            @if ($level === 'error')
                                                <h1 style="margin: 0 0 8px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 800; font-size: 26px; letter-spacing: 0.2em; color: #2c2b28; text-align: center;">@lang('Whoops!')</h1>
                                            @else
                                                <h1 style="margin: 0 0 8px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 800; font-size: 26px; letter-spacing: 0.2em; color: #2c2b28; text-align: center;">@lang('zup repa! score tayo, ano tara? ')</h1>
                                            @endif
                                        @endif
                                        <p style="color: #6b6258; font-size: 13px; text-align: center; margin: -4px 0 28px 0; font-weight: 400;">Secure your account password</p>

                                        <!-- Intro lines -->
                                        @foreach ($introLines as $line)
                                            <p style="margin: 0 0 16px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #2c2b28;">{{ $line }}</p>
                                        @endforeach

                                        <!-- Action button -->
                                        @isset($actionText)
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0 24px 0;">
                                                <tr>
                                                    <td align="center">
                                                        <table class="button-table" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                                            <tr>
                                                                <td class="button-td" align="center" bgcolor="#093B92" style="background-color: #093B92; border-radius: 40px;">
                                                                    <a href="{{ $actionUrl }}" class="button-a" target="_blank" style="display: inline-block; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 600; font-size: 15px; letter-spacing: 0.5px; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 40px; background-color: #093B92; border: 1px solid #093B92;">{{ $actionText }}</a>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        @endisset

                                        <!-- Outro lines -->
                                        @foreach ($outroLines as $line)
                                            <p style="margin: 0 0 16px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #2c2b28;">{{ $line }}</p>
                                        @endforeach

                                        <!-- Salutation -->
                                        <p style="margin: 32px 0 0 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #2c2b28;">
                                            @if (! empty($salutation))
                                                {{ $salutation }}
                                            @else
                                                @lang('Regards,')<br>
                                                <strong style="color: #093B92;">WARLEN INDUSTRIAL SALES CORP., DEKA Sales</strong>
                                            @endif
                                        </p>

                                        <!-- Divider before subcopy -->
                                        <div style="border-top: 1px solid #e2dbd1; margin: 36px 0 20px 0;"></div>

                                        <!-- Subcopy (fallback link) -->
                                        @isset($actionText)
                                            <p style="margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.4; color: #6b6258;">
                                                @lang(
                                                    "If you're having trouble clicking the \":actionText\" button, copy and paste the URL below\n".
                                                    'into your web browser:',
                                                    ['actionText' => $actionText]
                                                )
                                                <br>
                                                <span class="break-all" style="word-break: break-all; color: #093B92; text-decoration: underline;">
                                                    <a href="{{ $actionUrl }}" style="color: #093B92; text-decoration: underline;">{{ $actionUrl }}</a>
                                                </span>
                                            </p>
                                        @endisset

                                    </td>
                                </tr>
                            </table>

                            <!-- Footer -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
                                <tr>
                                    <td align="center" style="padding: 16px 20px;">
                                        <p style="margin: 0 0 6px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #6b6258;">Restricted Access — WARLEN INDUSTRIAL SALES CORP., DEKA Sales</p>
                                        <p style="margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #6b6258;">© {{ date('Y') }} All operational data is encrypted and monitored.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

</body>
</html>
