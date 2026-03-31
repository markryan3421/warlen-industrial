<?php

namespace App\Concerns;

use Spatie\Activitylog\Contracts\Activity;

trait LogsActivityTrait
{
    public function tapActivity(Activity $activity, string $eventName)
    {
        $properties = $activity->properties->toArray();

        // Define display names in the model
        $displayNames = $this->getActivityDisplayNames();

        // Transform both 'attributes' (new values) and 'old' (old values)
        foreach (['attributes', 'old'] as $key) {
            if (isset($properties[$key])) {
                $transformed = [];
                foreach ($properties[$key] as $field => $value) {
                    // Apply formatting if defined in the model
                    if (method_exists($this, 'formatActivityValue')) {
                        $value = $this->formatActivityValue($field, $value);
                    }
                    
                    $transformed[$displayNames[$field] ?? $field] = $value;
                }
                $properties[$key] = $transformed;
            }
        }

        $activity->properties = $properties;
    }

    /**
     * Override this method in your model to define display names
     * 
     * @return array
     */
    protected function getActivityDisplayNames(): array
    {
        return [];
    }
}