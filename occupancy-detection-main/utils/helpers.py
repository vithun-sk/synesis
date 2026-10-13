
import logging
import time

from config import (
    THRESHOLD_AVAILABLE,
    THRESHOLD_NEARLY_FULL,
    THRESHOLD_FULL,
    STATUS_AVAILABLE,
    STATUS_NEARLY_FULL,
    STATUS_FULL,
    STATUS_OVER_CAP,
    STATUS_COLORS,
    STATUS_EMOJIS,
)


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
    )


def calculate_occupancy(people_detected, capacity):
    if capacity <= 0:
        raise ValueError("Capacity must be greater than zero.")

    people_detected = max(0, int(people_detected))
    available_seats = max(0, capacity - people_detected)
    percentage = (people_detected / capacity) * 100

    if percentage < THRESHOLD_AVAILABLE:
        status = STATUS_AVAILABLE
    elif percentage < THRESHOLD_NEARLY_FULL:
        status = STATUS_NEARLY_FULL
    elif percentage <= THRESHOLD_FULL:
        status = STATUS_FULL
    else:
        status = STATUS_OVER_CAP

    return available_seats, percentage, status


def get_status_color(status):
    return STATUS_COLORS.get(status, "#808080")


def get_status_emoji(status):
    return STATUS_EMOJIS.get(status, "⚪")


class IntervalTimer:
    def __init__(self, interval_seconds):
        self.interval = max(0, float(interval_seconds))
        self.last_time = time.monotonic()

    def is_due(self):
        now = time.monotonic()
        if now - self.last_time >= self.interval:
            self.last_time = now
            return True
        return False


def format_percentage(value):
    return f"{float(value):.1f}%"
