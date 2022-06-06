<template>
  <div>
    <Datalog :address="address" />
  </div>
</template>

<script>
import Datalog from "../components/Datalog";

export default {
  props: ["address"],
  components: { Datalog }
};
</script>
