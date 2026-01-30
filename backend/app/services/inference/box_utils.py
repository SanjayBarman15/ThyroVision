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
