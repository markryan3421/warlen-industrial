<?php

namespace App\Models;

use App\Policies\AIInsightPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[UsePolicy(AIInsightPolicy::class)]
class AIInsight extends Model
{
    use HasFactory;
    
    protected $table = 'ai_insights';
    
    protected $fillable = [
        'type',
        'title',
        'description',
        'impact',
        'actionable',
        'metadata',
        'analyzed_at',
    ];
    
    protected $casts = [
        'actionable' => 'boolean',
        'metadata' => 'array',
        'analyzed_at' => 'datetime',
    ];
    
    // Scopes for filtering
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
    
    public function scopeHighImpact($query)
    {
        return $query->where('impact', 'high');
    }
    
    public function scopeActionable($query)
    {
        return $query->where('actionable', true);
    }
}