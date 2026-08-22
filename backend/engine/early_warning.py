BUCKET_ORDER = {"low": 0, "medium": 1, "high": 2}
SCORE_JUMP_THRESHOLD = 15.0

def is_early_warning(previous: any, current: any) -> bool:
    """
    Determines if the risk profile is trending up.
    Returns True if:
      - The risk bucket has increased (e.g. low -> medium, medium -> high)
      - The score has jumped by at least 15 points
    
    Supports both dictionaries and objects.
    """
    if previous is None:
        return False
        
    def get_val(item, attr):
        if isinstance(item, dict):
            return item.get(attr)
        return getattr(item, attr, None)

    curr_score = float(get_val(current, "final_score") or 0.0)
    prev_score = float(get_val(previous, "final_score") or 0.0)
    
    curr_bucket = str(get_val(current, "bucket") or "low").lower()
    prev_bucket = str(get_val(previous, "bucket") or "low").lower()

    bucket_rose = BUCKET_ORDER.get(curr_bucket, 0) > BUCKET_ORDER.get(prev_bucket, 0)
    score_jumped = (curr_score - prev_score) >= SCORE_JUMP_THRESHOLD

    return bucket_rose or score_jumped
