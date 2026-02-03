# Box utils

def xywh_to_xyxy(box: dict) -> dict:
    return {
        "xmin": box["x"],
        "ymin": box["y"],
        "xmax": box["x"] + box["width"],
        "ymax": box["y"] + box["height"],
        "image_width": box.get("image_width"),
        "image_height": box.get("image_height"),
        "format": "xyxy",
        "coordinate_space": box.get("coordinate_space", "raw_image"),
    }


def xyxy_to_xywh(box: dict) -> dict:
    return {
        "x": box["xmin"],
        "y": box["ymin"],
        "width": box["xmax"] - box["xmin"],
        "height": box["ymax"] - box["ymin"],
        "image_width": box.get("image_width"),
        "image_height": box.get("image_height"),
        "format": "xywh",
        "coordinate_space": box.get("coordinate_space", "raw_image"),
    }


def map_box_to_raw_image(box: dict, offset_x: int, offset_y: int, scale_factor: float, raw_w: int, raw_h: int) -> dict:
    """
    Transforms a bounding box from local crop space to raw image space.

    Args:
        box (dict): Box in xywh format relative to crop
        offset_x (int): X offset of the crop on raw image
        offset_y (int): Y offset of the crop on raw image
        scale_factor (float): Scale ratio (raw_size / crop_processed_size)
        raw_w (int): Total width of raw image
        raw_h (int): Total height of raw image

    Returns:
        dict: Transformed box in xywh format
    """
    return {
        "x": int((box["x"] * scale_factor) + offset_x),
        "y": int((box["y"] * scale_factor) + offset_y),
        "width": int(box["width"] * scale_factor),
        "height": int(box["height"] * scale_factor),
        "image_width": raw_w,
        "image_height": raw_h,
        "format": "xywh",
        "coordinate_space": "raw_image",
    }
