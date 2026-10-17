package com.dissertacao.logadvisor.backend.auth;

import java.util.List;

import com.dissertacao.logadvisor.backend.model.HistoryEntry;
import com.dissertacao.logadvisor.backend.repository.SearchHistoryRepository;
import com.dissertacao.logadvisor.backend.repository.UserRepository;
import com.dissertacao.logadvisor.backend.service.SearchHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Admin-only endpoints (guarded by SecurityConfig: /admin/** requires ROLE_ADMIN). */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final AuthService authService;
    private final SearchHistoryService searchHistoryService;

    /** Every analysis of every user, shared or not. */
    @GetMapping("/history")
    public ResponseEntity<List<HistoryEntry>> allHistory() {
        return ResponseEntity.ok(searchHistoryService.getAll());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserInfo>> users() {
        return ResponseEntity.ok(userRepository.findAll(Sort.by("id")).stream()
                .map(u -> UserInfo.from(u, searchHistoryRepository.countByUserId(u.getId())))
                .toList());
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id, @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(id, request);
        return ResponseEntity.noContent().build();
    }
}
