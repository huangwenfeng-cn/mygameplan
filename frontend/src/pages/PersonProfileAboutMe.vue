<template>
  <div class="mt-7 pb-16">
    <h2 class="mb-3 text-lg font-semibold text-ink-gray-8">关于</h2>
    <ReadmeEditor
      :resource="profile"
      :editable="$isSessionUser(profile.doc.user)"
      fieldname="readme"
      :placeholder="
        $isSessionUser(profile.doc.user)
          ? '写一段简短的自我介绍...'
          : '暂无介绍'
      "
      :border="false"
    />
  </div>
</template>
<script>
import ReadmeEditor from '@/components/ReadmeEditor.vue'
export default {
  name: 'PersonProfileAboutMe',
  props: ['profile'],
  components: { ReadmeEditor },
}
</script>
