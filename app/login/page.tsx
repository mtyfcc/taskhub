"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        router.push("/tasks");
    }

    return (
        <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="login-heading">
            <header>
            <Link className={styles.brand} href="/">
                TaskHub
            </Link>
            <h1 id="login-heading">登录</h1>
            <p>使用你的账号进入任务工作台。</p>
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
                <label htmlFor="email">邮箱</label>
                <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="password">密码</label>
                <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={6}
                required
                />
            </div>

            <label className={styles.remember}>
                <input name="remember" type="checkbox" />
                保持登录
            </label>

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "登录中..." : "登录"}
            </button>
            </form>

            <footer className={styles.footer}>
            <p>
                还没有账号？<a href="mailto:admin@example.com">联系管理员</a>
            </p>
            </footer>
        </section>
        </main>
    );
}
