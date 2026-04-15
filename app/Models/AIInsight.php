<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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