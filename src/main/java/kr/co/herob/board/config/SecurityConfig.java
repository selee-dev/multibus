package kr.co.herob.board.config;

import kr.co.herob.board.service.AccountService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

/** 세션 로그인, API별 접근 규칙, 비밀번호 암호화, 데모 관리자 준비를 구성합니다. */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** 공개 경로와 로그인 세션이 필요한 경로를 구분하는 보안 필터 체인을 만듭니다. */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityContextRepository contextRepository) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .securityContext(context -> context.securityContextRepository(contextRepository))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/h2-console/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/register", "/api/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/register/username-available").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/me").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated())
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .logout(logout -> logout
                .logoutUrl("/api/logout")
                .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)));

        return http.build();
    }

    /** 가입 비밀번호와 저장된 비밀번호 해시에 사용할 BCrypt 인코더를 제공합니다. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** 로그인 후 인증 정보를 HTTP 세션에 저장하도록 저장소를 제공합니다. */
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    /** 로그인 요청을 처리할 Spring Security 인증 관리자를 제공합니다. */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /** 개발 환경에서 기본 관리자 계정이 없을 때만 데모 계정을 생성합니다. */
    @Bean
    public ApplicationRunner seedDemoAdmin(AccountService accounts) {
        return args -> accounts.ensureDemoAdmin();
    }
}
