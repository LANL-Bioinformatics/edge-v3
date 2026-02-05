process foo {
  input:
  val x

  """
  echo $x 
  sleep 10
  """
}
process foo2 {
  input:
  val x

  """
  echo $x 
  sleep 1
  """
}

workflow {
  foo("test...")
  foo2("test2...")
}