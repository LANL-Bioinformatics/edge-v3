{{- define "webapp-stack.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "webapp-stack.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}