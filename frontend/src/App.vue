<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useAuthStore } from "@/stores/auth";
import { getCurrentUser } from "@/api/auth";

onLaunch(async () => {
  console.log("App Launch");
  const authStore = useAuthStore();
  authStore.initAuth();
  
  // 如果已登录，从服务器获取最新的用户信息
  if (authStore.isLoggedIn && authStore.token) {
    try {
      console.log("正在从服务器获取最新用户信息...");
      const userInfo = await getCurrentUser();
      console.log("从服务器获取到的用户信息:", userInfo);
      authStore.updateUserInfo(userInfo);
    } catch (error) {
      console.error("获取最新用户信息失败:", error);
    }
  }
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style></style>
