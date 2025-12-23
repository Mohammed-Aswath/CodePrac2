"""Circuit breaker pattern for Groq API resilience."""
import time
import logging
from threading import Lock

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """Circuit breaker for fault tolerance.
    
    States:
        CLOSED: Normal operation, requests pass through
        OPEN: Service unavailable, requests fail immediately
        HALF_OPEN: Testing if service recovered, allow single request
    """
    
    def __init__(self, failure_threshold=5, recovery_timeout=60, name="CircuitBreaker"):
        """Initialize circuit breaker.
        
        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds before attempting recovery
            name: Name for logging
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.name = name
        
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'
        self.lock = Lock()
    
    def record_success(self):
        """Record successful request."""
        with self.lock:
            self.failure_count = 0
            old_state = self.state
            self.state = 'CLOSED'
            
            if old_state != 'CLOSED':
                logger.info(f"[{self.name}] Circuit breaker recovered: {old_state} → CLOSED")
    
    def record_failure(self):
        """Record failed request."""
        with self.lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            old_state = self.state
            
            if self.failure_count >= self.failure_threshold:
                self.state = 'OPEN'
                logger.warning(
                    f"[{self.name}] Circuit breaker OPEN after {self.failure_count} failures"
                )
            
            if old_state != self.state:
                logger.warning(f"[{self.name}] State changed: {old_state} → {self.state}")
    
    def can_execute(self):
        """Check if request can be executed.
        
        Returns:
            bool: True if request should proceed, False if should fail fast
        """
        with self.lock:
            if self.state == 'CLOSED':
                return True
            
            if self.state == 'OPEN':
                elapsed = time.time() - self.last_failure_time
                if elapsed > self.recovery_timeout:
                    self.state = 'HALF_OPEN'
                    logger.info(
                        f"[{self.name}] Attempting recovery: OPEN → HALF_OPEN"
                    )
                    return True
                
                logger.debug(f"[{self.name}] Circuit is OPEN, rejecting request")
                return False
            
            # HALF_OPEN state - allow one request to test
            return True
    
    def get_state(self):
        """Get current circuit breaker state.
        
        Returns:
            dict: State information
        """
        with self.lock:
            return {
                "state": self.state,
                "failure_count": self.failure_count,
                "threshold": self.failure_threshold,
                "last_failure": self.last_failure_time,
                "recovery_timeout": self.recovery_timeout
            }
    
    def reset(self):
        """Manually reset circuit breaker."""
        with self.lock:
            self.failure_count = 0
            self.last_failure_time = None
            self.state = 'CLOSED'
            logger.info(f"[{self.name}] Circuit breaker manually reset")


# Global circuit breaker for Groq API
groq_circuit_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60,
    name="GroqAPI"
)


def with_circuit_breaker(func):
    """Decorator to wrap function with circuit breaker.
    
    Usage:
        @with_circuit_breaker
        def call_groq_api(...):
            pass
    """
    def wrapper(*args, **kwargs):
        if not groq_circuit_breaker.can_execute():
            error_msg = "Circuit breaker is OPEN - Groq API unavailable"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        try:
            result = func(*args, **kwargs)
            groq_circuit_breaker.record_success()
            return result
        except Exception as e:
            groq_circuit_breaker.record_failure()
            raise
    
    return wrapper
